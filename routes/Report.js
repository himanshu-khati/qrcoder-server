import express from "express";
import { generateVisitorReport } from "../controller/Reports.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/downloadReport", isAuthenticated, generateVisitorReport);

export default router;
