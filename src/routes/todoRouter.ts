import { Router } from "express";
import todoController from "../controllers/todoController.ts";

const router = Router();

router.get("/", todoController.getTodos);
router.get("/:id", todoController.getTodoById);
router.delete("/:id", todoController.deleteTodo);
router.post("/", todoController.addTodo);
router.put("/:id", todoController.updateTodo);

export default router;
