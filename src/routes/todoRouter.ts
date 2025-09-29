import { Router } from "express";
import todoController from "../controllers/todoController.ts";

const router = Router();

router.post("/clearCompleted", todoController.clearCompleted);
router.put("/toggleAll", todoController.toggleAll);
router.get("/:id", todoController.getTodos);
router.get("/getOne/:id", todoController.getTodoById);
router.delete("/:id", todoController.deleteTodo);
router.post("/", todoController.addTodo);
router.put("/:id", todoController.updateTodo);

export default router;
