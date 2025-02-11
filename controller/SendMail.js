import SmtpSettings from "../models/SmtpSettings.js";
import nodemailer from "nodemailer";
import EmailSettings from "../models/EmailSettings.js";
import Visitor from "../models/Visitor.js";
import { decrypt } from "../utils/encryptData.js";
import ErrorHandler from "../middlewares/errorHandler.js";

const convertPlainToHtml = (text) => {
  if (!text) return "";
  return text
    .split("\n")
    .map((line) => `<p>${line.trim()}</p>`)
    .join("");
};

//single email
export const sendVisitorEmail = async (req, res, next, visitorData = null) => {
  try {
    const visitorId = visitorData ? visitorData._id : req.params.id;

    // Fetch visitor details
    const visitor = visitorData || (await Visitor.findById(visitorId));
    if (!visitor) {
      return next(
        new ErrorHandler(
          "The visitor you are trying to send an email to does not exist.",
          404
        )
      );
    }

    // Fetch SMTP settings for the user
    const smtpSettings = await SmtpSettings.findOne({ user: req.user._id });
    if (!smtpSettings) {
      return next(
        new ErrorHandler(
          "SMTP settings are missing. Please configure your SMTP settings before sending emails.",
          404
        )
      );
    }

    const emailSettings = await EmailSettings.findOne({ user: req.user._id });
    if (!emailSettings) {
      return next(
        new ErrorHandler(
          "Email template settings are missing. Please configure email subject and body in settings.",
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
      const emailSubject = emailSettings.subject;
      const emailBodyPlain = emailSettings.body
        .replace(/{{visitorName}}/g, visitor.visitorName)
        .replace(
          /{{qrCode}}/g,
          '<img src="cid:qrCode" alt="Visitor QR Code" style="max-width: 300px;" />'
        );
      const emailBodyHtml = convertPlainToHtml(emailBodyPlain);

      // Prepare email content
      const mailOptions = {
        from: decryptedData.email,
        to: visitor.email,
        subject: emailSubject,
        html: emailBodyHtml,
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
        message: `Email successfully sent to ${visitor.email}.`,
        visitor,
      });
    } catch (decryptionError) {
      return res.status(500).json({
        success: false,
        message: `SMTP settings decryption failed. Please re-enter your credentials.`,
      });
    }
  } catch (error) {
    return next(
      new ErrorHandler(
        "Something went wrong while sending the email. Please try again later.",
        500
      )
    );
  }
};

// bulk email
export const bulkSendVisitorEmail = async (req, visitorData) => {
  try {
    const visitorId = visitorData ? visitorData._id : req.params.id;
    const visitor = visitorData || (await Visitor.findById(visitorId));

    if (!visitor) {
      console.error(`Visitor not found: ${visitorId}`);
      return {
        success: false,
        email: visitor.email,
        error: "Visitor not found",
      };
    }

    const smtpSettings = await SmtpSettings.findOne({ user: req.user._id });
    if (!smtpSettings) {
      console.error(`SMTP settings not found for user: ${req.user._id}`);
      return {
        success: false,
        email: visitor.email,
        error: "SMTP settings not found",
      };
    }

    const emailSettings = await EmailSettings.findOne({ user: req.user._id });
    if (!emailSettings) {
      console.error(`Email settings not found for user: ${req.user._id}`);
      return {
        success: false,
        email: visitor.email,
        error: "Email settings not found",
      };
    }

    const decryptedData = {
      email: decrypt(smtpSettings.email),
      password: decrypt(smtpSettings.password),
      server: decrypt(smtpSettings.server),
      port: decrypt(smtpSettings.port),
    };

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
    const emailSubject = emailSettings.subject;
    const emailBodyPlain = emailSettings.body.replace(
      /{{visitorName}}/g,
      visitor.visitorName
    );
    const emailBodyHtml = convertPlainToHtml(emailBodyPlain);
    const mailOptions = {
      from: decryptedData.email,
      to: visitor.email,
      subject: emailSubject,
      html: emailBodyHtml,
      attachments: [
        {
          filename: "visitor_qr_code.png",
          content: qrCodeBuffer,
          contentType: "image/png",
          cid: "qrCode",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${visitor.email}`);
    return { success: true, email: visitor.email };
  } catch (error) {
    console.error(
      `Failed to send email to ${visitorData.email}: ${error.message}`
    );
    return { success: false, email: visitorData.email, error: error.message };
  }
};
