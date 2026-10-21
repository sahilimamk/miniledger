import fs from 'fs';
import path from 'path';
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth';
import {
  uploadReceipt,
  validateReceiptImage,
  UPLOADS_DIR,
} from '../../middleware/upload';
import { HttpError } from '../../utils/httpError';
import { parseBody } from '../../utils/validate';
import { createLoanSchema, patchLoanSchema } from './loans.validators';
import * as service from './loans.service';

export const loansRouter = Router();
loansRouter.use(requireAuth);

loansRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = parseBody(createLoanSchema, req.body);
    const loan = await service.createLoan(req.userId!, input);
    res.status(201).json(loan);
  } catch (err) {
    next(err);
  }
});

loansRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ loans: await service.listLoans(req.userId!) });
  } catch (err) {
    next(err);
  }
});

loansRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await service.getLoan(req.userId!, req.params.id));
    } catch (err) {
      next(err);
    }
  },
);

loansRouter.patch(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patch = parseBody(patchLoanSchema, req.body);
      const loan = await service.updateLoan(req.userId!, req.params.id, patch);
      res.status(200).json(loan);
    } catch (err) {
      next(err);
    }
  },
);

loansRouter.post(
  '/:id/repay',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loan = await service.repayLoan(req.userId!, req.params.id);
      res.status(200).json(loan);
    } catch (err) {
      next(err);
    }
  },
);

loansRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.deleteLoan(req.userId!, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

loansRouter.post(
  '/:id/receipt',
  uploadReceipt,
  validateReceiptImage,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new HttpError(400, 'receipt file is required');
      const loan = await service.setReceiptUrl(
        req.userId!,
        req.params.id,
        `/uploads/${req.file.filename}`,
      );
      res.status(200).json(loan);
    } catch (err) {
      // Do not leave an orphaned file behind when the loan cannot be updated.
      if (req.file) {
        fs.unlink(path.join(UPLOADS_DIR, req.file.filename), () => undefined);
      }
      next(err);
    }
  },
);
