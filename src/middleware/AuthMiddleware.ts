import jwt, { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: string | JwtPayload;
}

export default function (req: AuthRequest, res: Response, next: NextFunction) {
  if (req.method === "OPTIONS") {
    next();
  }
  try {
    const token = req.headers?.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Not authorized" });
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ message: "Not authorized" });
  }
}
