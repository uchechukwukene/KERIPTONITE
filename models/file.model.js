import mongoose from "mongoose";

const { Schema } = mongoose;

export const fileSchema = new Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    base64: {
      type: String,
      required: true,
    },
    size: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  }
);

const File = mongoose.model("File", fileSchema);

export default File;
