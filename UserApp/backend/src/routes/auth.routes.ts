import { Router } from 'express';
import { BuyerAuthController } from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', BuyerAuthController.register);
authRouter.post('/login', BuyerAuthController.login);
authRouter.post('/send-otp', BuyerAuthController.sendOtp);
authRouter.post('/verify-otp', BuyerAuthController.verifyOtp);
authRouter.post('/phone-otp', BuyerAuthController.loginWithPhoneOtp);
authRouter.post('/google', BuyerAuthController.loginWithGoogle);
authRouter.post('/refresh-session', BuyerAuthController.refreshSession);
authRouter.put('/profile', BuyerAuthController.updateProfile);
authRouter.patch('/profile', BuyerAuthController.updateProfile);
