import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.ts";
import ApiError from "../error/ApiError.ts";

const ACCESS_TOKEN_EXPIRY = "1m";
const REFRESH_TOKEN_EXPIRY = "5m";

const generateTokens = (id: string, email: string, name: string) => {
  const accessToken = jwt.sign(
    { id, email, name },
    process.env.ACCESS_SECRET_KEY as string,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id, email, name },
    process.env.REFRESH_SECRET_KEY as string,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
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

      const candidate = await prisma.user.findUnique({ where: { email } });
      if (candidate) {
        return next(ApiError.badRequest("User with this email already exists"));
      }

      const hashPassword = await bcrypt.hash(password, 5);
      const user = await prisma.user.create({
        data: { email, name, password: hashPassword },
      });

      const { accessToken, refreshToken } = generateTokens(
        user.id,
        user.email,
        user.name
      );

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
        },
      });

      console.log({ accessToken, refreshToken });
      return res.json({ accessToken, refreshToken });
    } catch (error) {
      console.log(error);
      return next(ApiError.internal("Failed to register user"));
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return next(ApiError.badRequest("User not found!"));
      }

      const comparePassword = await bcrypt.compare(password, user.password);
      if (!comparePassword) {
        return next(ApiError.badRequest("Wrong password!"));
      }

      const { accessToken, refreshToken } = generateTokens(
        user.id,
        user.email,
        user.name
      );

      await prisma.refreshToken.upsert({
        where: { userId: user.id },
        update: { token: refreshToken },
        create: { userId: user.id, token: refreshToken },
      });

      console.log({ accessToken, refreshToken });
      return res.json({ accessToken, refreshToken });
    } catch (error) {
      console.log(error);
      return next(ApiError.internal("Failed to login user"));
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      if (!refreshToken) {
        return next(ApiError.unauthorized("No refresh token provided"));
      }

      const storedToken = await prisma.refreshToken.findFirst({
        where: { token: refreshToken },
      });

      if (!storedToken) {
        return next(ApiError.unauthorized("Invalid refresh token"));
      }

      let userData;
      try {
        userData = jwt.verify(
          refreshToken,
          process.env.REFRESH_SECRET_KEY as string
        ) as { id: string; email: string; name: string };
      } catch {
        return next(ApiError.unauthorized("Expired refresh token"));
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(
        userData.id,
        userData.email,
        userData.name
      );

      await prisma.refreshToken.update({
        where: { userId: userData.id },
        data: { token: newRefreshToken },
      });

      return res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      console.log(error);

      return next(ApiError.internal("Failed to refresh token"));
    }
  }

  async check(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized("Unauthorized"));
      }

      const accessToken = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
        },
        process.env.ACCESS_SECRET_KEY as string,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      return res.json({ accessToken });
    } catch (error) {
      console.log(error);
      return next(ApiError.internal("Failed to validate token"));
    }
  }
}

export default new UserController();
