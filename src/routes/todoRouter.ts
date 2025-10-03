import { Router } from "express";
import todoController from "../controllers/todoController.ts";
import AuthMiddleware from "../middleware/AuthMiddleware.ts";

const router = Router();

router.post("/clearCompleted", AuthMiddleware, todoController.clearCompleted);
router.put("/toggleAll", AuthMiddleware, todoController.toggleAll);
router.get("/:id", AuthMiddleware, todoController.getTodos);
router.get("/getOne/:id", todoController.getTodoById);
router.delete("/:id", AuthMiddleware, todoController.deleteTodo);
router.post("/", AuthMiddleware, todoController.addTodo);
router.put("/:id", AuthMiddleware, todoController.updateTodo);

export default router;
