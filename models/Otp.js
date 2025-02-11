import mongoose from "mongoose";
import { mailSender } from "../utils/mailSender.js";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 5 * 60,
  },
});

const sendVerificationEmail = async (email, otp) => {
  try {
    const mailResponse = await mailSender(
      email,
      "verification email from QRcoder app",
      otp
    );
  } catch (error) {
    throw error;
  }
};

otpSchema.pre("save", async function (next) {
  try {
    await sendVerificationEmail(this.email, this.otp);
    next();
  } catch (error) {
    next(error);
  }
});

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
