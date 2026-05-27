import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { listJobs, createJob, getJob, updateJob, deleteJob, CreateJobSchema, UpdateJobSchema } from "../controllers/jobController";

const router = Router();

router.get("/", authenticate, listJobs);
router.post("/", authenticate, validate(CreateJobSchema), createJob);
router.get("/:jobId", authenticate, getJob);
router.put("/:jobId", authenticate, validate(UpdateJobSchema), updateJob);
router.delete("/:jobId", authenticate, deleteJob);

export default router;
