import express from "express";
const router = express.Router();

// import controler
import {
  register,
  login,
  logout,
  myProfile,
  sendOtp,
} from "../controller/Auth.js";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  resetPasswordToken,
  resetPassword,
} from "../controller/ResetPassword.js";

// auth routes
router.post("/sendOtp", sendOtp);
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/myProfile", isAuthenticated, myProfile);
router.post("/reset-password-token", resetPasswordToken);
router.post("/reset-password", resetPassword);

export default router;