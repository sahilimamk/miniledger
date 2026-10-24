import { Router, Request, Response, NextFunction } from 'express';
import { requestOtp, verifyOtp } from './auth.service';
import { requestOtpSchema, verifyOtpSchema } from './auth.validators';
import { parseBody } from '../../utils/validate';

export const authRouter = Router();

authRouter.post('/request-otp', (req: Request, res: Response) => {
  const { phone } = parseBody(requestOtpSchema, req.body);
  const code = requestOtp(phone);
  // Return the code in the response — this is a demo build with no real SMS.
  res.status(200).json({ ok: true, code });
});

authRouter.post(
  '/verify-otp',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, code } = parseBody(verifyOtpSchema, req.body);
      const result = await verifyOtp(phone, code);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);
