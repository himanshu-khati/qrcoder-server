import User from "../models/User.js";
import bcrypt from "bcrypt";
import { sendCookie } from "../utils/sendCookie.js";
import ErrorHandler from "../middlewares/errorHandler.js";
import otpGenerator from "otp-generator";
import Otp from "../models/Otp.js";

// send otp
export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const checkUserExists = await User.findOne({ email });
    if (checkUserExists) {
      return next(new ErrorHandler("email already registered", 401));
    }
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    let result = await Otp.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await Otp.findOne({ otp: otp });
    }
    const otpPayload = { email, otp };
    const otpBody = await Otp.create(otpPayload);
    res.status(200).json({
      success: true,
      message: `otp sent succesfully`,
    });
  } catch (error) {
    return next(new ErrorHandler(`error sending otp: ${error.message} `, 501));
  }
};

// register controller
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, otp } =
      req.body;
    if (!firstName || !lastName || !email || !password || !otp) {
      return next(new ErrorHandler("all fields are required", 401));
    }
    if (password !== confirmPassword) {
      return next(
        new ErrorHandler(
          "password and confirm password doesn't match, please try again",
          400
        )
      );
    }

    const recentOtp = await Otp.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    // validate otp
    if (recentOtp.length === 0) {
      // otp not found
      return res.status(400).json({
        success: false,
        message: `otp not valid`,
      });
    } else if (otp !== recentOtp[0].otp) {
      return res.status(400).json({
        success: false,
        message: `otp don't match`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    sendCookie(user, res, "User Registered Successfully", 201);
  } catch (error) {
    return next(
      new ErrorHandler("user can't be registered: ${error.message}", 401)
    );
  }
};

// login controller
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler("all fields are required", 401));
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("user not registered", 401));
    }

    if (await bcrypt.compare(password, user.password)) {
      sendCookie(user, res, `Welcome Back, ${user.firstName}`, 200);
    } else {
      return next(new ErrorHandler("invalid email or password", 401));
    }
  } catch (error) {
    return next(
      new ErrorHandler(`Errror while logging in: ${error.message}`, 400)
    );
  }
};

// logout controller

export const logout = async (req, res, next) => {
  try {
    res.clearCookie("token", {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "Production", 
      sameSite: "None", 
    });

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(`Error while logging out: ${error.message}`, 501));
  }
};




// myprofile
export const myProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("visitors")
      .populate("campaigns");
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error while fetching user profile: ${error.message}`,
        501
      )
    );
  }
};
