import { Router } from "express";
const router = Router();
import todoRouter from "./todoRouter.ts";

router.use("/todo", todoRouter);

export default router;
