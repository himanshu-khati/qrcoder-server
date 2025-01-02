import Visitor from "../models/Visitor.js";
import User from "../models/User.js";
import QRCode from "qrcode";
import csv from "csv-parser";
import fs from "fs";
import ErrorHandler from "../middlewares/errorHandler.js";

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
      qrcode: null,
      campaign: campaign || null,
      user: req.user._id,
    });

    const qrCodeData = `http://localhost/qrcoder/visitor-confirm.php/${visitor._id}`;
    // const qrCode = await QRCode.toString(qrCodeData, { type: "utf8" });
    const qrCode = await QRCode.toDataURL(qrCodeData);
    console.log("qrcode: ", qrCode);
    visitor.qrcode = qrCode;
    await visitor.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { visitors: visitor._id },
    });
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

// Get All Visitors for Authenticated User
export const getVisitors = async (req, res, next) => {
  try {
    const visitors = await Visitor.find({ user: req.user._id }).populate(
      "campaign"
    );
    res.status(200).json({
      success: true,
      visitors,
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
    const visitor = await Visitor.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

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
      { checkedIn: true },
      { checkedInAt: Date.now },
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
