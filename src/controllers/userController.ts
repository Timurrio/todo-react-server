import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.ts";
import ApiError from "../error/ApiError.ts";

const generateJwt = (id: string, email: string, name: string): string => {
  return jwt.sign({ id, email, name }, process.env.SECRET_KEY as string, {
    expiresIn: "24h",
  });
};

class UserController {
  async registration(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body as {
        email: string;
        password: string;
        name: string;
      };

      if (!email || !password) {
        return next(ApiError.badRequest("Wrong email or password"));
      }

      const candidate = await prisma.user.findFirst({
        where: { email: email },
      });

      if (candidate) {
        return next(ApiError.badRequest("User with this email already exists"));
      }

      const hashPassword = await bcrypt.hash(password, 5);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashPassword,
        },
      });

      const token = generateJwt(user.id, user.email, user.name);
      return res.json({ token });
    } catch (error) {
      return next(ApiError.internal("Failed to register user"));
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };

      const user = await prisma.user.findFirst({
        where: { email },
      });

      if (!user) {
        return next(ApiError.internal("User not found!"));
      }

      const comparePassword = await bcrypt.compare(password, user.password);
      if (!comparePassword) {
        return next(ApiError.internal("Wrong password!"));
      }

      const token = generateJwt(user.id, user.email, user.name);
      return res.json({ token });
    } catch (error) {
      return next(ApiError.internal("Failed to login user"));
    }
  }

  async check(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        return next(ApiError.internal("Unauthorized"));
      }

      const token = generateJwt(req.user.id, req.user.email, req.user.name);
      return res.json({ token });
    } catch (error) {
      return next(ApiError.internal("Failed to validate token"));
    }
  }
}

export default new UserController();
