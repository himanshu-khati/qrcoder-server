import mongoose from "mongoose";
const emailSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  subject: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
});

const EmailSettings = mongoose.model("EmailSettings", emailSettingsSchema);
export default EmailSettings;
