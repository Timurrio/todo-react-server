import { Router } from "express";
const router = Router();
import todoRouter from "./todoRouter.ts";
import userRouter from "./userRouter.ts";

router.use("/todo", todoRouter);
router.use("/user", userRouter);

export default router;
