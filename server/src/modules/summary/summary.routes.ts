import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getSummary } from './summary.service';

export const summaryRouter = Router();
summaryRouter.use(requireAuth);

summaryRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await getSummary(req.userId!));
    } catch (err) {
      next(err);
    }
  },
);
