import mongoose from "mongoose";

const AuthSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      default: "",
    },
    passwordHash: {
      type: String,
      default: "",
    },
    resetTokenHash: {
      type: String,
      default: "",
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.AuthSetting ||
  mongoose.model("AuthSetting", AuthSettingSchema);