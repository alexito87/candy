import { NextFunction, Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      currentUserId?: string;
    }
  }
}

export function currentUser(req: Request, _res: Response, next: NextFunction) {
  const userId = req.header('x-user-id');
  if (userId) {
    req.currentUserId = userId;
  }
  next();
}
