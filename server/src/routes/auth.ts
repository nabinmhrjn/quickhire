import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { register, login, refresh, logout, RegisterSchema, LoginSchema } from "../controllers/authController";

const router = Router();

router.post("/register", validate(RegisterSchema), register);
router.post("/login", validate(LoginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);

export default router;
