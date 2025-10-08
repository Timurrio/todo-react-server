import { Request, Response, NextFunction } from "express";
import todoController from "../controllers/todoController.ts";
import ApiError from "../error/ApiError.ts";

jest.mock("../prismaClient", () => ({
  todo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

import prisma from "../prismaClient.ts";
import { RequestWithUser } from "../types/RequestWithUser.ts";

describe("TodoController", () => {
  let req: Partial<RequestWithUser>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: "user1", email: "test@email.com", name: "Timur" },
    };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should return todos for the correct user", async () => {
    (prisma.todo.findMany as jest.Mock).mockResolvedValue([
      { id: "1", text: "test" },
    ]);
    req.params = { id: "user1" };

    await todoController.getTodos(req as any, res as any, next);

    expect(prisma.todo.findMany).toHaveBeenCalledWith({
      where: { userId: "user1" },
    });
    expect(res.json).toHaveBeenCalledWith([{ id: "1", text: "test" }]);
  });

  it("should call next with forbidden error if user id mismatch", async () => {
    req.params = { id: "other" };

    await todoController.getTodos(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(
      ApiError.forbidden("No user or incorrect user id")
    );
  });

  it("should return todo if found", async () => {
    (prisma.todo.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      text: "abc",
    });
    req.params = { id: "1" };

    await todoController.getTodoById(req as any, res as any, next);

    expect(res.json).toHaveBeenCalledWith({ id: "1", text: "abc" });
  });

  it("should call next if todo not found", async () => {
    (prisma.todo.findUnique as jest.Mock).mockResolvedValue(null);
    req.params = { id: "nope" };

    await todoController.getTodoById(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(ApiError.badRequest("Todo not found"));
  });

  it("should create todo when valid", async () => {
    req.body = { text: "new todo", completed: false, userId: "user1" };
    (prisma.todo.create as jest.Mock).mockResolvedValue({
      id: "2",
      ...req.body,
    });

    await todoController.addTodo(req as any, res as any, next);

    expect(prisma.todo.create).toHaveBeenCalledWith({
      data: { text: "new todo", completed: false, userId: "user1" },
    });
    expect(res.json).toHaveBeenCalledWith({ id: "2", ...req.body });
  });

  it("should call next if userId mismatch", async () => {
    req.body = { text: "bad", completed: false, userId: "other" };

    await todoController.addTodo(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(ApiError.badRequest("userId wrong"));
  });

  it("should update todo if user owns it", async () => {
    (prisma.todo.findUnique as jest.Mock).mockResolvedValue({
      id: "3",
      userId: "user1",
    });
    (prisma.todo.update as jest.Mock).mockResolvedValue({
      id: "3",
      text: "updated",
    });
    req.params = { id: "3" };
    req.body = { text: "updated" };

    await todoController.updateTodo(req as any, res as any, next);

    expect(prisma.todo.update).toHaveBeenCalledWith({
      where: { id: "3" },
      data: { text: "updated" },
    });
    expect(res.json).toHaveBeenCalledWith({ id: "3", text: "updated" });
  });

  it("should call next if todo not found", async () => {
    (prisma.todo.findUnique as jest.Mock).mockResolvedValue(null);
    req.params = { id: "nope" };

    await todoController.updateTodo(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(ApiError.badRequest("Todo not found"));
  });

  it("should delete todo if user is owner", async () => {
    (prisma.todo.findUnique as jest.Mock).mockResolvedValue({
      id: "5",
      userId: "user1",
    });
    (prisma.todo.delete as jest.Mock).mockResolvedValue({ id: "5" });
    req.params = { id: "5" };

    await todoController.deleteTodo(req as any, res as any, next);

    expect(prisma.todo.delete).toHaveBeenCalledWith({ where: { id: "5" } });
    expect(res.json).toHaveBeenCalledWith({ id: "5" });
  });

  it("should update all todos", async () => {
    const todos = [
      { id: "1", userId: "user1", completed: true },
      { id: "2", userId: "user1", completed: false },
    ];
    (prisma.todo.update as jest.Mock)
      .mockResolvedValueOnce(todos[0])
      .mockResolvedValueOnce(todos[1]);
    req.body = { todos };

    await todoController.toggleAll(req as any, res as any, next);

    expect(prisma.todo.update).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(todos);
  });

  it("should delete completed todos", async () => {
    const todos = [{ id: "1", userId: "user1", completed: true }];
    (prisma.todo.deleteMany as jest.Mock).mockResolvedValue({});
    req.body = { todos };

    await todoController.clearCompleted(req as any, res as any, next);

    expect(prisma.todo.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["1"] } },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should call next if notCompletedTodos exist", async () => {
    const todos = [{ id: "1", userId: "user1", completed: false }];
    req.body = { todos };

    await todoController.clearCompleted(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(
      ApiError.badRequest("There are not completed todos")
    );
  });
});
