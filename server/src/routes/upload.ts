import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { upload, uploadAvatar, uploadJobPhoto } from "../controllers/uploadController";

const router = Router();

router.post("/avatar", authenticate, upload.single("file"), uploadAvatar);
router.post("/job-photo", authenticate, upload.single("file"), uploadJobPhoto);

export default router;
