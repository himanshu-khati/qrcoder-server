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
  cancelCheckin,
  getVisitorStats,
  createVisitorWithEmail,
  previewBulkUploadVisitor,
  saveBulkVisitors,
  searchVisitors,
  saveBulkVisitorsAndSendMail,
} from "../controller/Visitor.js";
import { sendVisitorEmail } from "../controller/SendMail.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { csvUpload } from "../middlewares/csvUpload.js";

// visitor routes
router.post("/newVisitor", isAuthenticated, createVisitor);
router.post("/newVisitorWithMail", isAuthenticated, createVisitorWithEmail);
router.post(
  "/newVisitor/bulkUpload",
  isAuthenticated,
  csvUpload,
  bulkUploadVisitors
);
router.post(
  "/newVisitor/preview",
  isAuthenticated,
  csvUpload,
  previewBulkUploadVisitor
);
router.post("/newVisitor/step2Upload", isAuthenticated, saveBulkVisitors);
router.post(
  "/newVisitor/bulk-save-and-email",
  isAuthenticated,
  saveBulkVisitorsAndSendMail
);
router.get("/allVisitors", isAuthenticated, getVisitors);
router.get("/dashboardData", isAuthenticated, getVisitorStats);
router.get("/:id", isAuthenticated, getVisitorById);
router.put("/:id", isAuthenticated, updateVisitor);
router.delete("/:id", isAuthenticated, deleteVisitor);
router.get("/:id/checkin", isAuthenticated, checkInVisitor);
router.get("/:id/cancelCheckin", isAuthenticated, cancelCheckin);
router.get("/:id/sendMail", isAuthenticated, sendVisitorEmail);
router.post("/search", isAuthenticated, searchVisitors);
export default router;
