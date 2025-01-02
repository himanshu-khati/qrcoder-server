import SmtpSettings from "../models/SmtpSettings.js";
import nodemailer from "nodemailer";
import Visitor from "../models/Visitor.js";
import { decrypt } from "../utils/encryptData.js";
import ErrorHandler from "../middlewares/errorHandler.js";

export const sendVisitorEmail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch visitor details
    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return next(new ErrorHandler(`visitor not found: ${error.message}`, 404));
    }

    // Fetch SMTP settings for the user
    const smtpSettings = await SmtpSettings.findOne({ user: req.user._id });
    if (!smtpSettings) {
      return next(
        new ErrorHandler(
          `smtp settings not found for this: ${error.message}`,
          404
        )
      );
    }

    // Decrypt SMTP settings
    try {
      const decryptedData = {
        email: decrypt(smtpSettings.email),
        password: decrypt(smtpSettings.password),
        server: decrypt(smtpSettings.server),
        port: decrypt(smtpSettings.port),
      };

      // Create Nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: decryptedData.server,
        port: parseInt(decryptedData.port, 10),
        secure: parseInt(decryptedData.port, 10) === 465,
        auth: {
          user: decryptedData.email,
          pass: decryptedData.password,
        },
      });
      const base64Data = visitor.qrcode.split(",")[1];
      const qrCodeBuffer = Buffer.from(base64Data, "base64");
      // Prepare email content
      const mailOptions = {
        from: decryptedData.email,
        to: visitor.email,
        subject: "Your Registration and QR Code",
        html: `
          <p>Dear ${visitor.visitorName},</p>
          <p>You have successfully registered as a visitor. Please find your QR code below.</p>
          <img src="cid:qrCode" alt="Visitor QR Code" style="max-width: 300px;" />
          <p>Thank you,</p>
          <p>Your Event Team</p>
        `,
        attachments: [
          {
            filename: "visitor_qr_code.png",
            content: qrCodeBuffer,
            contentType: "image/png",
            cid: "qrCode",
          },
        ],
      };

      // Send the email
      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: "Email sent successfully to the visitor",
      });
    } catch (decryptionError) {
      return res.status(500).json({
        success: false,
        message: `Error decrypting SMTP settings: ${decryptionError.message}`,
      });
    }
  } catch (error) {
    return next(
      new ErrorHandler(`error sending message: ${error.message}`, 500)
    );
  }
};
