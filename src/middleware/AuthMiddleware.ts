import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import ApiError from "../error/ApiError.ts";

interface AuthRequest extends Request {
  user?: string | JwtPayload;
}

export default function (req: AuthRequest, res: Response, next: NextFunction) {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers?.authorization?.split(" ")[1];
    if (!token) {
      return next(ApiError.forbidden("Not authorized"));
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string);
    req.user = decoded;
    next();
  } catch (e) {
    return next(ApiError.forbidden("Not authorized"));
  }
}
