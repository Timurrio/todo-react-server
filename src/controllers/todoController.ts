import type { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient.ts";
import ApiError from "../error/ApiError.ts";
import { type Todo } from "../types/Todo.ts";

class TodoController {
  async getTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const todos = await prisma.todo.findMany({ where: { userId: id } });
      return res.json(todos);
    } catch (error) {
      next(ApiError.internal("Failed to get todos"));
    }
  }

  async getTodoById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        next(ApiError.badRequest("Invalid id"));
      }

      const todo = await prisma.todo.findUnique({
        where: { id: id },
      });

      if (!todo) {
        next(ApiError.badRequest("Todo not found"));
      }

      return res.json(todo);
    } catch (error) {
      next(ApiError.internal("Failed to fetch todo"));
    }
  }

  async deleteTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        next(ApiError.badRequest("ID is required to delete todo"));
      }

      const deletedTodo = await prisma.todo.delete({
        where: { id: id },
      });

      return res.json(deletedTodo);
    } catch (error) {
      next(ApiError.internal("Failed to delete todo"));
    }
  }

  async addTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, completed, userId } = req.body;

      if (!text) {
        next(ApiError.badRequest("Text is required"));
      }

      const newTodo = await prisma.todo.create({
        data: {
          text,
          completed: completed ?? false,
          userId,
        },
      });

      return res.json(newTodo);
    } catch (error) {
      next(ApiError.internal("Failed to add todo"));
    }
  }

  async updateTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { text, completed } = req.body;

      if (!id) {
        next(ApiError.badRequest("ID is required"));
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
      next(ApiError.internal("Failed to update todo"));
    }
  }

  async toggleAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { todos }: { todos: Todo[] } = req.body;

      if (!Array.isArray(todos) || todos.length === 0) {
        next(ApiError.badRequest("todo[] must not be empty"));
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
      next(ApiError.internal("Internal server error"));
    }
  }

  async clearCompleted(req: Request, res: Response, next: NextFunction) {
    try {
      const { todos }: { todos: Todo[] } = req.body;

      if (!Array.isArray(todos) || todos.length === 0) {
        next(ApiError.badRequest("todo[] must not be empty"));
      }

      const ids = todos.map((t) => t.id);

      await prisma.todo.deleteMany({
        where: {
          id: { in: ids },
        },
      });

      return res.status(200).json(ids);
    } catch (error) {
      next(ApiError.internal("Internal server error"));
    }
  }
}

export default new TodoController();
