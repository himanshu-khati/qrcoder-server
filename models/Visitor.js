import mongoose from "mongoose";
import Counter from "./Counter.js";

const visitorSchema = new mongoose.Schema(
  {
    visitorName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address.",
      ],
    },
    mobile: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, "Please provide a valid 10-digit mobile number."],
      required: true,
    },
    details: {
      type: String,
      trim: true,
    },
    qrcode: {
      type: String,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: false,
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serial: {
      type: Number,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);
visitorSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "visitorSerial" },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.serial = counter.value;
    } catch (error) {
      next(error);
    }
  }
  next();
});

const Visitor = mongoose.model("Visitor", visitorSchema);
export default Visitor;
