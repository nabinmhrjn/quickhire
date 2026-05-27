import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { getJobApplications, getMyApplications, applyToJob, updateApplicationStatus, ApplicationSchema, UpdateApplicationSchema } from "../controllers/applicationController";

const router = Router();

router.get("/job/:jobId", authenticate, getJobApplications);
router.get("/", authenticate, getMyApplications);
router.post("/:jobId", authenticate, validate(ApplicationSchema), applyToJob);
router.patch("/:id", authenticate, validate(UpdateApplicationSchema), updateApplicationStatus);

export default router;
