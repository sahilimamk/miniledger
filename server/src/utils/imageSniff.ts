/**
 * Image type detection from magic bytes — the ONLY trusted signal for
 * receipt uploads. The client-declared Content-Type and filename extension
 * are attacker-controlled and are never consulted.
 *
 * Raster formats only. SVG and HTML are deliberately absent: both are
 * executable markup and must never be stored under /uploads.
 */

export type ImageType = 'jpeg' | 'png' | 'webp' | 'gif';

/** Canonical extension for each sniffed type (dot included). */
export const IMAGE_EXTENSIONS: Record<ImageType, string> = {
  jpeg: '.jpg',
  png: '.png',
  webp: '.webp',
  gif: '.gif',
};

/** Identify an image from its first bytes; null when not an allowed image. */
export function sniffImageType(head: Buffer): ImageType | null {
  // JPEG: FF D8 FF
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'jpeg';
  }
  // PNG: 89 50 4E 47 (‰PNG)
  if (
    head.length >= 4 &&
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47
  ) {
    return 'png';
  }
  // WebP: 'RIFF' .... 'WEBP'
  if (
    head.length >= 12 &&
    head.toString('ascii', 0, 4) === 'RIFF' &&
    head.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  // GIF: 'GIF8'
  if (head.length >= 4 && head.toString('ascii', 0, 4) === 'GIF8') {
    return 'gif';
  }
  return null;
}
