import type { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient.ts";

class TodoController {
  async getTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const todo = await prisma.todo.findUnique({
        where: { id: Number(id) },
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
        where: { id: Number(id) },
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

      return res.status(201).json(newTodo);
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
        where: { id: Number(id) },
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
}

export default new TodoController();
