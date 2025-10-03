import type { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient.ts";
import ApiError from "../error/ApiError.ts";
import { type Todo } from "../types/Todo.ts";
import { type RequestWithUser } from "../types/RequestWithUser.ts";

class TodoController {
  async getTodos(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user || req.user.id !== id) {
        return next(ApiError.forbidden("No user or incorrect user id"));
      }

      const todos = await prisma.todo.findMany({ where: { userId: id } });
      return res.json(todos);
    } catch (error) {
      return next(ApiError.internal("Failed to get todos"));
    }
  }

  async getTodoById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        return next(ApiError.badRequest("Invalid id"));
      }

      const todo = await prisma.todo.findUnique({
        where: { id: id },
      });

      if (!todo) {
        return next(ApiError.badRequest("Todo not found"));
      }

      return res.json(todo);
    } catch (error) {
      return next(ApiError.internal("Failed to fetch todo"));
    }
  }

  async deleteTodo(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        return next(ApiError.forbidden("No user"));
      }

      const todo = await prisma.todo.findUnique({ where: { id: id } });

      if (!todo || req.user.id !== todo.userId) {
        return next(ApiError.badRequest("No todo found or wrong user id"));
      }

      if (!id) {
        return next(ApiError.badRequest("ID is required to delete todo"));
      }

      const deletedTodo = await prisma.todo.delete({
        where: { id: id },
      });

      return res.json(deletedTodo);
    } catch (error) {
      return next(ApiError.internal("Failed to delete todo"));
    }
  }

  async addTodo(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      const { text, completed, userId } = req.body;

      if (!req.user) {
        return next(ApiError.forbidden("Not authorized"));
      }

      if (userId !== req.user.id) {
        return next(ApiError.badRequest("userId wrong"));
      }

      if (!text) {
        return next(ApiError.badRequest("Text is required"));
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
      return next(ApiError.internal("Failed to add todo"));
    }
  }

  async updateTodo(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { text, completed } = req.body;

      if (!id) {
        return next(ApiError.badRequest("ID is required"));
      }

      const todo = await prisma.todo.findUnique({
        where: { id },
      });

      if (!todo) {
        return next(ApiError.badRequest("Todo not found"));
      }

      if (!req.user || todo.userId !== req.user.id) {
        return next(
          ApiError.forbidden("You do not have permission to update this todo")
        );
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
      return next(ApiError.internal("Failed to update todo"));
    }
  }

  async toggleAll(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      const { todos }: { todos: Todo[] } = req.body;

      if (!req.user) {
        return next(ApiError.forbidden("Not authorized"));
      }

      if (req.user.id !== todos[0].userId) {
        return next(ApiError.badRequest("Wrong userId"));
      }

      if (!Array.isArray(todos) || todos.length === 0) {
        return next(ApiError.badRequest("todo[] must not be empty"));
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
      return next(ApiError.internal("Internal server error"));
    }
  }

  async clearCompleted(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { todos }: { todos: Todo[] } = req.body;

      const notCompletedTodos = todos.some((td) => td.completed === false);
      if (notCompletedTodos) {
        return next(ApiError.badRequest("There are not completed todos"));
      }

      if (!req.user) {
        return next(ApiError.forbidden("Not authorized"));
      }

      if (req.user.id !== todos[0].userId) {
        return next(ApiError.badRequest("Wrong userId"));
      }

      if (!Array.isArray(todos) || todos.length === 0) {
        return next(ApiError.badRequest("todo[] must not be empty"));
      }

      const ids = todos.map((t) => t.id);

      await prisma.todo.deleteMany({
        where: {
          id: { in: ids },
        },
      });

      return res.status(200).json(ids);
    } catch (error) {
      return next(ApiError.internal("Internal server error"));
    }
  }
}

export default new TodoController();
