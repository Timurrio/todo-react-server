import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../error/ApiError.ts";

export default function (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(ApiError.unauthorized("No token provided"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY as string);
    req.user = decoded;
    next();
  } catch (e) {
    return next(ApiError.unauthorized("Invalid or expired token"));
  }
}
