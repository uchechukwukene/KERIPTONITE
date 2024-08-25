import fs from "fs/promises";
import User from "../models/userModel.js";
import { InvalidError, InternalServerError } from "../lib/appError.js";
import authService from "./auth.service.js";
import File from "../models/file.model.js";

class FileService {
  async uploadFile(apiKey, file) {
    if (!file.mimetype.startsWith("image/")) {
      throw new InvalidError("Only image files are allowed");
    }

    const user = await authService.findUserByApiKey(apiKey);
    if (!user) {
      throw new InvalidError("Invalid API key");
    }

    const fileData = await fs.readFile(file.path);
    const fileBase64 = fileData.toString("base64");

    // Save file in the database
    const newFile = {
      filename: file.originalname,
      contentType: file.mimetype,
      base64: fileBase64,
      size: file.size,
      userId: user._id,
    };
    let createFile;

    try {
      createFile = new File({
        filename: file.originalname,
        contentType: file.mimetype,
        base64: fileBase64,
        size: file.size,
        userId: user._id,
      });

      console.log(createFile)
      await createFile.save();
    } catch (e) {
        console.log(e)
      throw new InternalServerError("Failed to save file to database");
    }

    // await user.save();

    // Delete the file from the file system
    await fs.unlink(file.path);

    return createFile;
  }

  async getFile(userId, fileId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const file = user.files.id(fileId);
    if (!file) {
      throw new NotFoundError("File not found");
    }

    return file;
  }

  async getAllFiles(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user.files;
  }

  async saveBase64Files(body) {
    if (!Array.isArray(body)) {
      throw new Error("Expected an array of base64 data objects.");
    }

    const savedFiles = [];
    const rootFolderPath = "./files"; // Root folder path for all files

    // Ensure the root folder exists
    if (!fs.existsSync(rootFolderPath)) {
      fs.mkdirSync(rootFolderPath);
    }

    for (const fileData of body) {
      const { base64Data } = fileData;

      // Remove header from base64 string
      const base64Image = base64Data.replace(/^data:\w+\/\w+;base64,/, "");

      // Convert base64 string to binary data
      const binaryData = Buffer.from(base64Image, "base64");

      // Determine file extension and folder name
      const fileType = base64Data.split(";")[0].split("/")[1];
      const folderPath = `${rootFolderPath}/${fileType}`; // Combine root and file type

      // Create folder if it doesn't exist for this specific file type
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }

      // Generate unique file name with current date and time
      const fileName = `file_${Date.now()}.${fileType}`;

      // Specify file path
      const filePath = `${folderPath}/${fileName}`;

      fs.writeFileSync(filePath, binaryData);
      savedFiles.push(filePath); // Add filePath to savedFiles

      return savedFiles; // Return an array of saved file paths
    }
  }
}

export default new FileService();
