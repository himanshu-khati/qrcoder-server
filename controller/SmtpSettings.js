import SmtpSettings from "../models/SmtpSettings.js";
import { encrypt, decrypt } from "../utils/encryptData.js";
import ErrorHandler from "../middlewares/errorHandler.js";

// save smtp settings
export const saveSmtpSettings = async (req, res, next) => {
  try {
    const { email, password, server, port } = req.body;
    if (!email || !password || !server || !port) {
      return next(
        new ErrorHandler(`all fields are required: ${error.message}`, 401)
      );
    }

    const existingSettings = await SmtpSettings.findOne({ user: req.user._id });

    const encryptedData = {
      email: encrypt(email),
      password: encrypt(password),
      server: encrypt(server),
      port: encrypt(port),
    };

    if (existingSettings) {
      existingSettings.email = encryptedData.email;
      existingSettings.password = encryptedData.password;
      existingSettings.server = encryptedData.server;
      existingSettings.port = encryptedData.port;
      await existingSettings.save();
    } else {
      await SmtpSettings.create({
        ...encryptedData,
        user: req.user._id,
      });
    }
    res.status(201).json({
      success: true,
      message: "smtp settings saved successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(`error saving smtp settings: ${error.message}`, 500)
    );
  }
};

// fetch settings
export const getSmtpSettings = async (req, res, next) => {
  try {
    const settings = await SmtpSettings.findOne({ user: req.user._id });

    if (!settings) {
      return next(new ErrorHandler("SMTP settings not found", 404));
    }

    const decryptedData = {
      email: decrypt(settings.email),
      password: decrypt(settings.password),
      server: decrypt(settings.server),
      port: decrypt(settings.port),
    };

    res.status(200).json({
      success: true,
      settings: decryptedData,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error fetching SMTP settings: ${error.message}`, 500)
    );
  }
};
