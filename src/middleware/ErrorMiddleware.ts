import ApiError from "../error/ApiError.ts";
import type { Request, Response, NextFunction } from "express";

export default (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  } else {
    return res.status(500).json({ message: "Error on server" });
  }
};
