import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const userRouter = Router();

userRouter.get('/me', async (req, res) => {
  const fallback = await prisma.user.findFirst({ where: { email: 'parent@candy.test' } });
  const userId = req.currentUserId ?? fallback?.id;

  if (!userId) {
    return res.status(404).json({ message: 'User not found' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, children: true }
  });

  return res.json(user);
});

userRouter.get('/demo-users', async (_req, res) => {
  const users = await prisma.user.findMany({ include: { role: true, children: true }, orderBy: { email: 'asc' } });
  res.json(users);
});
