import express from "express";
import {
  saveSmtpSettings,
  getSmtpSettings,
} from "../controller/SmtpSettings.js";
const router = express.Router();
import { isAuthenticated } from "../middlewares/auth.js";

router.get("/smtpSettings", isAuthenticated, getSmtpSettings);
router.post("/smtpSettings", isAuthenticated, saveSmtpSettings);
export default router;
