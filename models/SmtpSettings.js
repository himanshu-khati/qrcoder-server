import mongoose from "mongoose";
import { decrypt, encrypt } from "../utils/encryptData.js";

const SmtpSettingSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    required: true,
    get: decrypt,
    set: encrypt,
  },
  password: {
    type: String,
    required: true,
    // select: false,
    get: decrypt,
    set: encrypt,
  },
  server: {
    type: String,
    trim: true,
    required: true,
    get: decrypt,
    set: encrypt,
  },
  port: {
    type: String,
    trim: true,
    required: true,
    get: decrypt,
    set: encrypt,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
});

const SmtpSettings = mongoose.model("SmtpSettings", SmtpSettingSchema);
export default SmtpSettings;
