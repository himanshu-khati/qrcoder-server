import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import User from "../models/User.js";
import ErrorHandler from "../middlewares/errorHandler.js";

// Create a Campaign
export const createCampaign = async (req, res, next) => {
  try {
    const { campaignName, description } = req.body;
    if (!campaignName || !description) {
      return next(
        new ErrorHandler(
          `campaign name and description are required: ${error.message}`,
          401
        )
      );
    }
    const campaign = await Campaign.create({
      campaignName,
      description,
      user: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { campaigns: campaign._id },
    });

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      campaign,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error while creating create: ${error.message}`, 501)
    );
  }
};

// Get All Campaigns for Authenticated User
export const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ user: req.user._id });
    if (!campaigns) {
      return next(
        new ErrorHandler(`campaign not found: ${error.message}`, 401)
      );
    }
    res.status(200).json({
      success: true,
      campaigns,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error while fetching campaign: ${error.message}`, 501)
    );
  }
};

// Get a Single Campaign
export const getCampaignById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next(
        new ErrorHandler(`invalid campaign id: ${error.message}`, 400)
      );
    }
    const campaign = await Campaign.findOne({
      _id: id,
      user: req.user._id,
    }).populate("visitors");
    if (!campaign) {
      return next(
        new ErrorHandler(`campaign not found: ${error.message}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      campaign,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error while fetitching campaign: ${error.message}`, 400)
    );
  }
};

// Update a Campaign
export const updateCampaign = async (req, res, next) => {
  try {
    const { visitors, ...otherFields } = req.body;
    const updateData = {
      ...otherFields,
    };

    if (visitors) {
      updateData.$addToSet = { visitors: { $each: visitors } };
    }
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return next(
        new ErrorHandler(
          `campaign not found or not authorised: ${error.message}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      campaign,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error while updating campaign: ${error.message}`, 501)
    );
  }
};

// Delete a Campaign
export const deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!campaign) {
      return next(
        new ErrorHandler(`campaign not found: ${error.message}`, 404)
      );
    }

    // Remove campaign from user's campaigns array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { campaigns: campaign._id },
    });

    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error while deleting campaign: ${error.message}`, 501)
    );
  }
};
