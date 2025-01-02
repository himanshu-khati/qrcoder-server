import express from "express";
const router = express.Router();
import {
  createVisitor,
  deleteVisitor,
  getVisitorById,
  getVisitors,
  updateVisitor,
  checkInVisitor,
  bulkUploadVisitors,
} from "../controller/Visitor.js";
import { sendVisitorEmail } from "../controller/SendMail.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { csvUpload } from "../middlewares/csvUpload.js";

// visitor routes
router.post("/newVisitor", isAuthenticated, createVisitor);
router.post(
  "/newVisitor/bulkUpload",
  isAuthenticated,
  csvUpload,
  bulkUploadVisitors
);
router.get("/allVisitors", isAuthenticated, getVisitors);
router.get("/:id", isAuthenticated, getVisitorById);
router.put("/:id", isAuthenticated, updateVisitor);
router.delete("/:id", isAuthenticated, deleteVisitor);
router.get("/:id/checkin", isAuthenticated, checkInVisitor);
router.get("/:id/sendMail", isAuthenticated, sendVisitorEmail);
export default router;
