import express from "express";
import FileController from "../controllers/file.controller.js";
import multer from "multer";
import { authentication } from "../middleware/authentication.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/base64tofile",
  authentication,
  FileController.oldbase64ToFileHandler
);
router.post("/upload-file", upload.single("file"), FileController.uploadFile);
router.get("/files/:userId/:fileId", FileController.getFile);
router.get("/files/:userId", FileController.getAllFiles);

export default router;
