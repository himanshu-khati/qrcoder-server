import express from "express";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middlewares/errorHandler.js";
// import routes
import userRoutes from "./routes/User.js";
import visitorRoutes from "./routes/Visitor.js";
import campaignRoutes from "./routes/Campaign.js";
import reportRoutes from "./routes/Report.js";
import smtpSettingRoutes from "./routes/SmtpSettings.js";
export const app = express();

app.use(express.json());
app.use(cookieParser());

//mount routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/visitor", visitorRoutes);
app.use("/api/v1/campaign", campaignRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/settings", smtpSettingRoutes);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: `welcome to qr code api`,
  });
});
app.use(errorMiddleware);
