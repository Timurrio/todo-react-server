import { Router } from "express";
import userController from "../controllers/userController.ts";
import AuthMiddleware from "../middleware/AuthMiddleware.ts";

const router = Router();

router.post("/registration", userController.registration);
router.post("/login", userController.login);
router.get("/auth", AuthMiddleware, userController.check);
router.post("/refresh", userController.refresh);

export default router;
