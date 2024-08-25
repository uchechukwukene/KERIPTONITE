import mongoose from "mongoose";
import { fileSchema } from "./file.model.js";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minLength: [6, "Password must be upto 6 charaters"],
      // select: false,
    },
    role: {
      type: String,
      required: true,
      default: "guest",
      enum: ["guest", "supergirl"],
    },
    apiKey: {
      type: String,
      unique: true,
    },
    otpCode: { type: String, default: "" },
    passwordOtp: { type: String, default: "" },
    file: [fileSchema],

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
