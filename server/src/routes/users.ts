import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { getMe, updateMe, getPublicProfile, UpdateProfileSchema } from "../controllers/userController";

const router = Router();

router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, validate(UpdateProfileSchema), updateMe);
router.get("/:userId", getPublicProfile);

export default router;
