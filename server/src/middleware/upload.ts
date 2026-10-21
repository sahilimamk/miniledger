import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/httpError';
import { sniffImageType, IMAGE_EXTENSIONS } from '../utils/imageSniff';

// server/uploads — the same ../../ resolution works from src/middleware
// (tsx) and dist/middleware (compiled build).
export const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Files land under a server-generated name with NO extension. The real
// extension is only assigned by validateReceiptImage, from the sniffed
// content type — the user's filename/extension never reaches the disk.
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, _file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique);
  },
});

/**
 * Single upload, form field `receipt`, 5 MB limit.
 * No content filter here on purpose: the declared mimetype proves nothing.
 * Content is validated by validateReceiptImage below.
 */
export const uploadReceipt = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('receipt');

async function readHead(filePath: string, bytes: number): Promise<Buffer> {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buf, 0, bytes, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

/**
 * Post-upload gate: sniff the saved file's magic bytes. Anything that is not
 * a JPEG/PNG/WebP/GIF raster image (HTML and SVG included) is deleted and
 * rejected with 400. A match is renamed to carry the canonical extension of
 * the SNIFFED type, and req.file is updated to the final name.
 */
export async function validateReceiptImage(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.file) {
    next();
    return;
  }
  try {
    const type = sniffImageType(await readHead(req.file.path, 12));
    if (!type) {
      await fs.promises.unlink(req.file.path).catch(() => undefined);
      next(
        new HttpError(400, 'receipt must be an image (JPEG, PNG, WebP or GIF)'),
      );
      return;
    }
    const finalName = req.file.filename + IMAGE_EXTENSIONS[type];
    const finalPath = path.join(UPLOADS_DIR, finalName);
    await fs.promises.rename(req.file.path, finalPath);
    req.file.filename = finalName;
    req.file.path = finalPath;
    next();
  } catch (err) {
    next(err);
  }
}
