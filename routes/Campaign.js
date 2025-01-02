import express from "express";
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} from "../controller/Campaign.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/createCampaign", isAuthenticated, createCampaign);
router.get("/getAllCampaign", isAuthenticated, getCampaigns);
router.get("/:id", isAuthenticated, getCampaignById);
router.put("/:id", isAuthenticated, updateCampaign);
router.delete("/:id", isAuthenticated, deleteCampaign);

export default router;
