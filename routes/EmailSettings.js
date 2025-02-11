import express from "express";
import {
  getEmailSettings,
  updateEmailSettings,
} from "../controller/EmailSettings.js";
import { isAuthenticated } from "../middlewares/auth.js";
const router = express.Router();

router.get("/email-settings", isAuthenticated, getEmailSettings);
router.put("/email-settings", isAuthenticated, updateEmailSettings);
export default router;
