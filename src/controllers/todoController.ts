import type { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient.ts";

class TodoController {
  async getTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const todos = await prisma.todo.findMany();
      return res.json(todos);
    } catch (error) {
      next(error);
    }
  }

  async getTodoById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const todo = await prisma.todo.findUnique({
        where: { id: id },
      });

      if (!todo) {
        return res.status(404).json({ message: "Todo not found" });
      }

      return res.json(todo);
    } catch (error) {
      console.error("Error in getTodo:", error);
      return res.status(500).json({ message: "Failed to fetch todo", error });
    }
  }

  async deleteTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "ID is required" });
      }

      const deletedTodo = await prisma.todo.delete({
        where: { id: id },
      });

      return res.json(deletedTodo);
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete todo", error });
    }
  }

  async addTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, completed } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const newTodo = await prisma.todo.create({
        data: {
          text,
          completed: completed ?? false,
        },
      });

      return res.json(newTodo);
    } catch (error) {
      return res.status(500).json({ message: "Failed to add todo", error });
    }
  }

  async updateTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { text, completed } = req.body;

      if (!id) {
        return res.status(400).json({ message: "ID is required" });
      }

      const updatedTodo = await prisma.todo.update({
        where: { id: id },
        data: {
          ...(text !== undefined && { text }),
          ...(completed !== undefined && { completed }),
        },
      });

      return res.json(updatedTodo);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update todo", error });
    }
  }

  async toggleAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { todos } = req.body;

      if (!Array.isArray(todos) || todos.length === 0) {
        return res.status(400).json({ message: "todo[] must not be empty" });
      }

      const updates = await Promise.all(
        todos.map((t) =>
          prisma.todo.update({
            where: { id: t.id },
            data: { completed: t.completed },
          })
        )
      );

      return res.status(200).json(updates);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async clearCompleted(req: Request, res: Response, next: NextFunction) {
    try {
      const { todos } = req.body;

      if (!Array.isArray(todos) || todos.length === 0) {
        return res.status(400).json({ message: "todo[] must not be empty" });
      }

      const ids = todos.map((t) => t.id);

      const result = await prisma.todo.deleteMany({
        where: {
          id: { in: ids },
        },
      });

      return res.status(200).json(ids);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default new TodoController();
