import express from "express";
import { saveSmtpSettings } from "../controller/SmtpSettings.js";
const router = express.Router();
import { isAuthenticated } from "../middlewares/auth.js";

router.post("/saveSettings", isAuthenticated, saveSmtpSettings);
export default router;
