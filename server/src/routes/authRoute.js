import authController from '../controllers/authController.js';
import express from 'express';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/verify-email/:token', authController.verifyEmail);
router.post('/request-reset-password', authController.requestResetPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/resend-verification', authController.resendVerification);
router.post('/signin', authController.signin);
router.post('/signout', authController.signout);
router.post('/refresh-token', authController.refreshToken);

export default router;
