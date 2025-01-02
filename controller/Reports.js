import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import Visitor from "../models/Visitor.js";
import { fileURLToPath } from "url";
import ErrorHandler from "../middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateVisitorReport = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = { user: req.user._id };
    if (status === "checked-in") {
      filter.checkedIn = true;
    } else if (status === "pending") {
      filter.checkedIn = false;
    }
    const visitors = await Visitor.find(filter);
    if (!visitors) {
      return next(
        new ErrorHandler(`visiotrs not found: ${error.message}`, 404)
      );
    }
    const visitorData = visitors.map((visitor) => ({
      visitorId: visitor._id,
      visitorName: visitor.visitorName,
      email: visitor.email,
      description: visitor.details,
      checkInTime: visitor?.checkedInAt
        ? visitor?.checkedInAt.toISOString()
        : "N/A",
      checkInStatus: visitor.checkedIn ? "Checked In" : "Pending",
    }));
    const filePath = path.join(
      __dirname,
      "../reports",
      `visitors_${status || "all"}.csv`
    );
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: "visitorId", title: "Visitor ID" },
        { id: "name", title: "Name" },
        { id: "email", title: "Email" },
        { id: "description", title: "Description" },
        { id: "checkinTime", title: "Check-in Time" },
        { id: "checkinStatus", title: "Check-in Status" },
      ],
    });
    await csvWriter.writeRecords(visitorData);
    res.download(filePath, (err) => {
      if (err) {
        return next(
          new ErrorHandler(
            `campaign generating or downloading the csv file: ${error.message}`,
            500
          )
        );
      }
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error generating visitor report: ${error.message}`, 500)
    );
  }
};
