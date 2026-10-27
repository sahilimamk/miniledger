import { Router, Request, Response, NextFunction } from 'express';
import { requestOtp, verifyOtp } from './auth.service';
import { requestOtpSchema, verifyOtpSchema } from './auth.validators';
import { parseBody } from '../../utils/validate';
import { isDemoAuth } from '../../config/env';

export const authRouter = Router();

authRouter.post('/request-otp', (req: Request, res: Response) => {
  const { phone } = parseBody(requestOtpSchema, req.body);
  const code = requestOtp(phone);
  // Demo gate: the code leaves the server ONLY when DEMO_AUTH=true. With
  // the flag off, the client learns nothing but { ok, demo: false } — a
  // real code channel (SMS provider) is then the only way to sign in.
  if (isDemoAuth()) {
    res.status(200).json({ ok: true, code, demo: true });
  } else {
    res.status(200).json({ ok: true, demo: false });
  }
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
