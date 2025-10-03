import type { Request } from "express";

export type RequestWithUser = Request & {
  user?: { id: string; email: string; name: string };
};
