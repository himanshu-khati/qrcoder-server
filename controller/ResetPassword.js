import User from "../models/User.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { mailSender } from "../utils/mailSender.js";

// send reset passeword link
export const resetPasswordToken = async (req, res, next) => {
  try {
    // get email from request body
    const { email } = req.body;
    // check user for email, email validaion
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: `your email is not registered with us`,
      });
    }
    // genreate token
    const token = crypto.randomBytes(32).toString("hex");
    // update user by adding token and expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      { token: token, resetPasswordExpires: Date.now() + 5 * 60 * 1000 },
      { new: true }
    );
    // create url
    const url = `https://localhost:3000/reset-password?token=${token}`;
    // send mail conatianing url
    await mailSender(email, "reset qrcoder password", url);
    // return response
    return res.status(200).json({
      success: true,
      message: `mail sent successfully`,
    });
  } catch (error) {
    return res.status.json({
      success: false,
      message: `something went wrong resetting password: ${error.message}`,
    });
  }
};

// reset password
export const resetPassword = async (req, res) => {
  try {
    // fetch data from request body
    const { password, confirmPassword, token } = req.body;
    // validation
    if (password !== confirmPassword) {
      return res.status(401).json({
        success: false,
        message: `password don't match`,
      });
    }
    // get user details
    const userDetails = await User.findOne({ token: token });
    // if invalid token retun respone
    if (!token) {
      return res.status(400).json({
        success: false,
        message: `token is invalid`,
      });
    }
    // check token expiry time
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.status(401).json({
        success: false,
        message: `token is expired please generate a new passeord`,
      });
    }
    // hash password'
    const hashedPassword = await bcrypt.hash(password, 10);
    // update password
    await User.findOneAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );
    // return response
    return res.status(200).json({
      success: true,
      message: `reset password successful`,
    });
  } catch (error) {
    return res.status(501).json({
      success: false,
      message: `something went wrong reseting password, please try again : ${error.message} `,
    });
  }
};
