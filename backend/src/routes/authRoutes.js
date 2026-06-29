import express from 'express';
import { registerUser,verifyRegistrationUser, loginUser, verifyLoginUser, logoutUser , resendOtpHandler,changePasswordController,resetPasswordController,forgotPasswordController,generateLoginCredentials, addAdmin,googleAuthController,facebookAuthController, setup2FA, enable2FA, disable2FA, verifyTotpLogin} from '../app/controllers/authController.js';
import authMiddleware from '../app/middleware/authMiddleware.js';
import verifyTokenMiddleware from '../app/middleware/verifyTokenMiddleware.js';

const router = express.Router();

// Auth Routes
router.post('/register', registerUser); 
router.post('/verify-register', verifyRegistrationUser);
router.post('/login', loginUser);
router.post('/verify-login', verifyLoginUser);
router.post('/google', googleAuthController);
router.post('/facebook', facebookAuthController);
router.post('/logout', verifyTokenMiddleware,authMiddleware ,logoutUser);
router.post("/assign-login-credentials", generateLoginCredentials);
router.post('/resend-otp',verifyTokenMiddleware,authMiddleware, resendOtpHandler);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);
router.post("/change-password",verifyTokenMiddleware,authMiddleware,changePasswordController);
router.post('/add',verifyTokenMiddleware,authMiddleware, addAdmin);

// TOTP 2FA
router.post('/2fa/setup',   verifyTokenMiddleware, authMiddleware, setup2FA);
router.post('/2fa/enable',  verifyTokenMiddleware, authMiddleware, enable2FA);
router.post('/2fa/disable', verifyTokenMiddleware, authMiddleware, disable2FA);
router.post('/2fa/login',   verifyTotpLogin);


// Example of a protected route
router.get('/protected', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'This is a protected route.', user: req.user });
});

router.get("/test-session", (req, res) => {
    console.log("🔹 Session ID:", req.sessionID);
    console.log("🔹 Full Session Data:", req.session);

    req.session.test = "Hello Session!";
    req.session.save(() => {
        res.json({ sessionID: req.sessionID, session: req.session });
    });
});

  

export default router;
