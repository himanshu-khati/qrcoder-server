import jwt from "jsonwebtoken";

export const sendCookie = (user, res, message, statusCode = 200) => {
  const token = jwt.sign({ _id: user.id }, process.env.JWT_SECRET, { expiresIn: "12h" });

  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
    sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
    secure: process.env.NODE_ENV === "Development" ? false : true,
  });

  res.status(statusCode).json({
    success: true,
    message,
  });
};
