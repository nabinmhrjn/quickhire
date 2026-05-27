import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { getReviews, createReview, CreateReviewSchema } from "../controllers/reviewController";

const router = Router();

router.get("/", getReviews);
router.post("/", authenticate, validate(CreateReviewSchema), createReview);

export default router;
