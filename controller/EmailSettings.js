import EmailSettings from "../models/EmailSettings.js";
import ErrorHandler from "../middlewares/errorHandler.js";

export const getEmailSettings = async (req, res, next) => {
  try {
    const emailSettings = await EmailSettings.findOne({ user: req.user._id });

    if (!emailSettings) {
      return next(new ErrorHandler("Email settings not found.", 404));
    }

    res.status(200).json({
      success: true,
      emailSettings,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error fetching email settings: ${error.message}`, 500)
    );
  }
};

export const updateEmailSettings = async (req, res, next) => {
  try {
    const { subject, body } = req.body;

    if (!subject || !body) {
      return next(new ErrorHandler("Subject and body are required.", 400));
    }

    const emailSettings = await EmailSettings.findOneAndUpdate(
      { user: req.user._id },
      { subject, body },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Email settings updated successfully.",
      emailSettings,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error updating email settings: ${error.message}`, 500)
    );
  }
};
