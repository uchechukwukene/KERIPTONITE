import express from "express";
import AuthController from "../controllers/auth.controller.js";
import {
  otpCodeSchema,
  resendOtp,
  signUpSchema,
  validateForgotPassword,
  validateLoginUserSchema,
  validateResetForgotPassword,
} from "../validator/authValidators.js";
import Validate from "../validator/index.js";
import { authentication } from "../middleware/authentication.js";

const router = express.Router();

router.post(
  "/register",
  Validate(signUpSchema),
  AuthController.register.bind(AuthController)
);

router.post(
  "/otp-verification",
  Validate(otpCodeSchema),
  AuthController.verifyOtpHandler.bind(AuthController)
);

router.post(
  "/login-otp-verification",
  Validate(otpCodeSchema),
  AuthController.verifyLoginOtpHandler.bind(AuthController)
);

router.post(
  "/login",
  Validate(validateLoginUserSchema),
  AuthController.login.bind(AuthController)
);

router.post(
  "/forgot_password",
  Validate(validateForgotPassword),
  AuthController.forgotPassword.bind(AuthController)
);

router.patch(
  "/reset_password",
  Validate(validateResetForgotPassword),
  AuthController.resetPassword.bind(AuthController)
);

router.post(
  "/resend-otp",
  Validate(resendOtp),
  AuthController.resendOtp.bind(AuthController)
);

router.post(
  "/generate-api-key", authentication,
  AuthController.generateApiKey.bind(AuthController)
);

router.patch(
  "/invalidate-api-key",authentication,
  AuthController.invalidateApiKey.bind(AuthController)
);

export default router;
