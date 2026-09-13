import { Router } from 'express';
import { generalRateLimit, strictRateLimit } from '../middleware/rateLimit.middleware.js';
import { AuthController } from '../controllers/auth.controller.js';

export const authRouter = Router();

// Send OTP to phone (rate-limited strictly — 10/min per IP)
authRouter.post('/send-otp',   strictRateLimit, AuthController.sendOtp);

// Login with phone + OTP → returns JWT + profile
authRouter.post('/login',      strictRateLimit, AuthController.login);

// Register new partner → saves to database, returns JWT + profile
authRouter.post('/register',   generalRateLimit, AuthController.register);

// Google OAuth Login for Delivery Partners
authRouter.post('/google',     generalRateLimit, AuthController.loginWithGoogle);

// Logout → clears server-side session
authRouter.post('/logout',     generalRateLimit, AuthController.logout);
