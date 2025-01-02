import jwt from "jsonwebtoken";
import dotenv from "dotenv";

export const sendCookie = (user, res, message, statusCode = 200) => {
  const token = jwt.sign({ _id: user.id }, process.env.JWT_SECRET);
  res
    .status(statusCode)
    .cookie("token", token, {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      message,
    });
};