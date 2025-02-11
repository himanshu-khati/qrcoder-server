import Visitor from "../models/Visitor.js";
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import QRCode from "qrcode";
import csv from "csv-parser";
import fs from "fs";
import ErrorHandler from "../middlewares/errorHandler.js";
import { bulkSendVisitorEmail, sendVisitorEmail } from "./SendMail.js";
import mongoose from "mongoose";
// create visitor controller
export const createVisitor = async (req, res, next) => {
  try {
    const { visitorName, email, mobile, details, campaign } = req.body;
    if (!visitorName || !email || !mobile || !details) {
      return next(
        new ErrorHandler(`all fields are required: ${error.message}`, 401)
      );
    }

    const visitor = await Visitor.create({
      visitorName,
      email,
      details,
      mobile,
      qrcode: null,
      campaign: campaign || null,
      user: req.user._id,
    });

    // const qrCodeData = `http://localhost/qrcoder/visitor-confirm.php/${visitor._id}`;
    const qrCodeData = `${visitor._id}`;
    // const qrCode = await QRCode.toString(qrCodeData, { type: "utf8" });
    const qrCode = await QRCode.toDataURL(qrCodeData);
    visitor.qrcode = qrCode;
    await visitor.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { visitors: visitor._id },
    });
    if (campaign) {
      await Campaign.findByIdAndUpdate(campaign, {
        $push: { visitors: visitor._id },
      });
    }
    return res.status(201).json({
      success: true,
      message: "visitor created successfully",
      visitor,
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `error while creating a new visitor: ${error.message}`,
        501
      )
    );
  }
};

// create visitor and send email
export const createVisitorWithEmail = async (req, res, next) => {
  try {
    const { visitorName, email, mobile, details, campaign } = req.body;
    if (!visitorName || !email || !mobile || !details) {
      return next(
        new ErrorHandler(`all fields are required: ${error.message}`, 401)
      );
    }
    const visitor = await Visitor.create({
      visitorName,
      email,
      details,
      mobile,
      qrcode: null,
      campaign: campaign || null,
      user: req.user._id,
    });
    const qrCodeData = `http://localhost/qrcoder/visitor-confirm.php/${visitor._id}`;
    // const qrCode = await QRCode.toString(qrCodeData, { type: "utf8" });
    const qrCode = await QRCode.toDataURL(qrCodeData);
    visitor.qrcode = qrCode;
    await visitor.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { visitors: visitor._id },
    });
    if (campaign) {
      await Campaign.findByIdAndUpdate(campaign, {
        $push: { visitors: visitor._id },
      });
    }
    const emailResult = await sendVisitorEmail(req, res, next, visitor);
    res.status(201).json({
      success: true,
      message: "Visitor created and email sent successfully",
      visitor,
      emailResult,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error while creating visitor: ${error.message}`, 501)
    );
  }
};

// Get All Visitors for Authenticated User
export const getVisitors = async (req, res, next) => {
  try {
    const { campaign, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const query = { user: req.user._id };
    if (campaign && mongoose.Types.ObjectId.isValid(campaign)) {
      query.campaign = campaign;
    }
    const totalVisitors = await Visitor.countDocuments(query);

    const visitors = await Visitor.find(query)
      .populate("campaign")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);
    res.status(200).json({
      success: true,
      visitors,
      pagination: {
        totalVisitors,
        totalPages: Math.ceil(totalVisitors / limitNumber),
        currentPage: pageNumber,
        pageSize: limitNumber,
      },
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error fetching visitors: ${error.message}`, 501)
    );
  }
};

// Get a Single Visitor
export const getVisitorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);

    const query = isObjectId
      ? { _id: id, user: userId }
      : { serial: id, user: userId };

    const visitor = await Visitor.findOne(query);

    if (!visitor) {
      return next(new ErrorHandler(`visitor not found: ${error.message}`, 401));
    }

    res.status(200).json({
      success: true,
      visitor,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error fetching visitor: ${error.message}`, 500)
    );
  }
};

// Update a Visitor
export const updateVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!visitor) {
      return next(new ErrorHandler(`visitor not found: ${error.message}`, 404));
    }

    res.status(200).json({
      success: true,
      message: "Visitor updated successfully",
      visitor,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error updating visitor: ${error.message}`, 501)
    );
  }
};

// Delete a Visitor
export const deleteVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!visitor) {
      return next(new ErrorHandler(`visitor not found: ${error.message}`, 404));
    }

    // Remove visitor from user's visitors array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { visitors: visitor._id },
    });

    if (visitor.campaign) {
      await Campaign.findByIdAndUpdate(visitor.campaign, {
        $pull: { visitors: visitor._id },
      });
    }

    res.status(200).json({
      success: true,
      message: "Visitor deleted successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error updating visitor: ${error.message}`, 501)
    );
  }
};

// checkIn visitor
export const checkInVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findByIdAndUpdate(
      { _id: id },
      { checkedIn: true, checkedInAt: Date.now() },
      { new: true }
    );
    if (!visitor) {
      return next(new ErrorHandler(`visitor not found: ${error.message}`, 404));
    }
    res.status(200).json({
      success: true,
      message: `visitor checked in successfully`,
      visitor,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error during checkin process: ${error.message}`, 501)
    );
  }
};

// cancel checkin
export const cancelCheckin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findByIdAndUpdate(
      { _id: id },
      { checkedIn: false, checkedInAt: null },
      { new: true }
    );
    if (!visitor) {
      return next(new ErrorHandler(`visitor not found: ${error.message}`, 404));
    }
    res.status(200).json({
      success: true,
      message: `check in  cancelled`,
      visitor,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error during checkin process: ${error.message}`, 501)
    );
  }
};

// get visitor dashbord stats

export const getVisitorStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const totalVisitors = await Visitor.countDocuments({ user: userId });
    const qrCodesGenerated = await Visitor.countDocuments({
      user: userId,
      qrcode: { $ne: null },
    });
    const checkedInVisitors = await Visitor.countDocuments({
      user: userId,
      checkedIn: true,
    });
    const pendingVisitors = totalVisitors - checkedInVisitors;
    res.status(200).json({
      success: true,
      message: "dashbord data fetched successfully",
      data: {
        totalVisitors,
        qrCodesGenerated,
        checkedInVisitors,
        pendingVisitors,
      },
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error fetching dashboard data: ${error.message}`, 501)
    );
  }
};

// step 1 preview bulk upload visitor
export const previewBulkUploadVisitor = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(
        new ErrorHandler(
          `No file uploaded. Please Upload CSV file: ${error.message}`,
          401
        )
      );
    }
    const filePath = req.file.path;
    const visitors = [];
    const { campaign } = req.body;
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (row.visitorName && row.email && row.mobile && row.details) {
          visitors.push({
            visitorName: row.visitorName,
            email: row.email,
            mobile: row.mobile,
            details: row.details,
            campaign: campaign || row.campaign || null,
            user: req.user._id,
          });
        }
      })
      .on("end", () => {
        fs.unlinkSync(filePath);
        return res.status(200).json({
          success: true,
          visitors,
        });
      })
      .on("error", (error) => {
        return next(
          new ErrorHandler(`Error reading CSV file: ${error.message}`, 500)
        );
      });
  } catch (error) {
    return next(
      new ErrorHandler(`Error processing file: ${error.message}`, 500)
    );
  }
};

// step2 bulk upload visitor
export const saveBulkVisitors = async (req, res, next) => {
  try {
    const { visitors } = req.body;
    if (!visitors || !Array.isArray(visitors)) {
      return next(new ErrorHandler("Invalid visitors data", 400));
    }

    const insertedVisitors = [];

    for (const visitorData of visitors) {
      const visitor = await Visitor.create({
        ...visitorData,
        qrcode: null,
        user: req.user._id,
      });

      const qrCodeData = `http://localhost/qrcoder/visitor-confirm.php/${visitor._id}`;
      const qrCode = await QRCode.toDataURL(qrCodeData);
      visitor.qrcode = qrCode;
      await visitor.save();

      insertedVisitors.push(visitor);
      if (visitor.campaign) {
        await Campaign.findByIdAndUpdate(visitor.campaign, {
          $push: { visitors: visitor._id },
        });
      }
    }

    await User.findByIdAndUpdate(req.user._id, {
      $push: { visitors: { $each: insertedVisitors.map((v) => v._id) } },
    });
    res.status(201).json({
      success: true,
      message: "Visitors saved successfully",
      visitors: insertedVisitors,
      visitorsCreated: insertedVisitors.length,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error saving visitors: ${error.message}`, 500)
    );
  }
};

// bulk upload visitor
export const bulkUploadVisitors = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(
        new ErrorHandler(
          `No file uploaded. Please Upload CSV file: ${error.message}`,
          401
        )
      );
    }
    const filePath = req.file.path;
    const visitors = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (row.visitorName && row.email && row.mobile && row.details) {
          visitors.push({
            visitorName: row.visitorName,
            email: row.email,
            mobile: row.mobile,
            details: row.details,
            campaign: row.campaign || null,
            user: req.user._id,
          });
        }
      })
      .on("end", async () => {
        try {
          const insertedVisitors = [];
          for (const visitorData of visitors) {
            const visitor = await Visitor.create({
              ...visitorData,
              qrcode: null,
            });
            const qrCodeData = `http://localhost/qrcoder/visitor-confirm.php/${visitor._id}`;
            const qrCode = await QRCode.toDataURL(qrCodeData);
            visitor.qrcode = qrCode;
            await visitor.save();
            insertedVisitors.push(visitor);
          }
          const visitorIds = insertedVisitors.map((visitor) => visitor._id);
          await User.findByIdAndUpdate(req.user._id, {
            $push: { visitors: { $each: visitorIds } },
          });
          fs.unlinkSync(filePath);
          return res.status(201).json({
            success: true,
            message: "Visitors uploaded successfully.",
            insertedVisitors,
          });
        } catch (error) {
          return next(
            new ErrorHandler(`Error processing visitor: ${error.message}`, 500)
          );
        }
      })
      .on("error", (error) => {
        return next(
          new ErrorHandler(`Error reading file: ${error.message}`, 500)
        );
      });
  } catch (error) {
    return next(
      new ErrorHandler(`Error during bulk upload: ${error.message}`, 500)
    );
  }
};

// search visitors
export const searchVisitors = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return next(new ErrorHandler("Search query is required.", 400));
    }
    const regexQuery = new RegExp(query, "i");
    const isObjectId = mongoose.Types.ObjectId.isValid(query);
    const isNumber = /^\d+$/.test(query);
    const searchCriteria = {
      user: req.user._id,
      $or: [
        { visitorName: regexQuery },
        { email: regexQuery },
        { mobile: regexQuery },
        isNumber ? { serial: Number(query) } : null,
        isObjectId ? { campaign: query } : null,
        ,
      ].filter(Boolean),
    };

    const visitors = await Visitor.find(searchCriteria).populate(
      "campaign",
      "campaignName"
    );

    res.status(200).json({
      success: true,
      visitors,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error searching visitors: ${error.message}`, 500)
    );
  }
};

//bulk send mail and save visitors
export const saveBulkVisitorsAndSendMail = async (req, res, next) => {
  try {
    const { visitors } = req.body;
    if (!visitors || !Array.isArray(visitors)) {
      return next(new ErrorHandler("Invalid visitors data", 400));
    }

    const insertedVisitors = [];
    const emailResults = [];

    for (const visitorData of visitors) {
      try {
        const visitor = await Visitor.create({
          ...visitorData,
          qrcode: null,
          user: req.user._id,
        });

        const qrCodeData = `http://localhost/qrcoder/visitor-confirm.php/${visitor._id}`;
        visitor.qrcode = await QRCode.toDataURL(qrCodeData);
        await visitor.save();

        insertedVisitors.push(visitor);

        if (visitor.campaign) {
          await Campaign.findByIdAndUpdate(visitor.campaign, {
            $push: { visitors: visitor._id },
          });
        }
      } catch (error) {
        console.error(`Error processing visitor: ${error.message}`);
      }
    }
    const emailPromises = insertedVisitors.map((visitor) =>
      bulkSendVisitorEmail(req, visitor)
    );
    const resolvedEmailResults = await Promise.allSettled(emailPromises);

    resolvedEmailResults.forEach((result) => {
      if (result.status === "fulfilled") {
        emailResults.push(result.value);
      } else {
        emailResults.push({
          email: "unknown",
          success: false,
          error: result.reason,
        });
      }
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { visitors: { $each: insertedVisitors.map((v) => v._id) } },
    });

    return res.status(201).json({
      success: true,
      message: "Visitors saved and emails sent",
      visitors: insertedVisitors,
      visitorsCreated: insertedVisitors.length,
      emailResults,
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error saving visitors and sending emails: ${error.message}`,
        500
      )
    );
  }
};
