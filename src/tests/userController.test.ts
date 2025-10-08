import userController from "../controllers/userController.ts";
import prisma from "../prismaClient.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ApiError from "../error/ApiError.ts";

jest.mock("../prismaClient", () => ({
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../error/ApiError", () => ({
  badRequest: jest.fn((msg) => ({ message: msg, status: 400 })),
  internal: jest.fn((msg) => ({ message: msg, status: 500 })),
}));

describe("UserController", () => {
  const mockReq: any = {};
  const mockRes: any = { json: jest.fn() };
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registration", () => {
    it("should return token for new user", async () => {
      mockReq.body = {
        email: "test@mail.com",
        password: "12345",
        name: "Timur",
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPass");
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "1",
        email: "test@mail.com",
        name: "Timur",
      });
      (jwt.sign as jest.Mock).mockReturnValue("fakeToken");

      await userController.registration(mockReq, mockRes, mockNext);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: "test@mail.com" },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: "test@mail.com", name: "Timur", password: "hashedPass" },
      });
      expect(mockRes.json).toHaveBeenCalledWith({ token: "fakeToken" });
    });

    it("should call next with error if user exists", async () => {
      mockReq.body = {
        email: "test@mail.com",
        password: "12345",
        name: "Timur",
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 1 });

      await userController.registration(mockReq, mockRes, mockNext);

      expect(ApiError.badRequest).toHaveBeenCalledWith(
        "User with this email already exists"
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ status: 400 })
      );
    });
  });

  describe("login", () => {
    it("should return token when login success", async () => {
      mockReq.body = { email: "test@mail.com", password: "12345" };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: "1",
        email: "test@mail.com",
        password: "hashed",
        name: "Timur",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("fakeToken");

      await userController.login(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ token: "fakeToken" });
    });

    it("should call next if user not found", async () => {
      mockReq.body = { email: "none@mail.com", password: "12345" };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await userController.login(mockReq, mockRes, mockNext);

      expect(ApiError.internal).toHaveBeenCalledWith("User not found!");
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ status: 500 })
      );
    });

    it("should call next if wrong password", async () => {
      mockReq.body = { email: "test@mail.com", password: "wrong" };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: "1",
        email: "test@mail.com",
        password: "hashed",
        name: "Timur",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await userController.login(mockReq, mockRes, mockNext);

      expect(ApiError.internal).toHaveBeenCalledWith("Wrong password!");
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ status: 500 })
      );
    });
  });

  describe("check", () => {
    it("should return token if user is authorized", async () => {
      mockReq.user = { id: "1", email: "test@mail.com", name: "Timur" };
      (jwt.sign as jest.Mock).mockReturnValue("validToken");

      await userController.check(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ token: "validToken" });
    });

    it("should call next if user is not authorized", async () => {
      mockReq.user = undefined;

      await userController.check(mockReq, mockRes, mockNext);

      expect(ApiError.internal).toHaveBeenCalledWith("Unauthorized");
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ status: 500 })
      );
    });
  });
});
