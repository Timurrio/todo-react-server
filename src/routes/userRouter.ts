import { Router } from "express";

const router = Router();
import userController from "../controllers/userController.ts";
import AuthMiddleware from "../middleware/AuthMiddleware.ts";

router.post("/registration", userController.registration);
router.post("/login", userController.login);
router.get("/auth", AuthMiddleware, userController.check);

export default router;
