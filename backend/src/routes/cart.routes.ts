import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const cartRouter = Router();

const addCartItemSchema = z.object({
  userId: z.string().uuid(),
  studentId: z.string().uuid(),
  menuId: z.string().uuid(),
  menuDishId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().default(1)
});

cartRouter.get('/', async (req, res) => {
  const userId = String(req.query.userId ?? req.currentUserId ?? '');
  const studentId = String(req.query.studentId ?? '');
  const menuId = String(req.query.menuId ?? '');

  if (!userId || !studentId || !menuId) {
    return res.status(400).json({ message: 'userId, studentId and menuId are required' });
  }

  const cart = await prisma.cart.upsert({
    where: { userId_studentId_menuId: { userId, studentId, menuId } },
    create: { userId, studentId, menuId },
    update: {},
    include: { items: { include: { menuDish: { include: { dish: true, meal: { include: { menuDay: true } } } } } } }
  });

  res.json(cart);
});

cartRouter.post('/items', async (req, res) => {
  const data = addCartItemSchema.parse(req.body);

  const cart = await prisma.cart.upsert({
    where: { userId_studentId_menuId: { userId: data.userId, studentId: data.studentId, menuId: data.menuId } },
    create: { userId: data.userId, studentId: data.studentId, menuId: data.menuId },
    update: {}
  });

  const item = await prisma.cartItem.upsert({
    where: { cartId_menuDishId: { cartId: cart.id, menuDishId: data.menuDishId } },
    create: { cartId: cart.id, menuDishId: data.menuDishId, quantity: data.quantity },
    update: { quantity: { increment: data.quantity } },
    include: { menuDish: { include: { dish: true } } }
  });

  res.status(201).json(item);
});

cartRouter.delete('/items/:cartItemId', async (req, res) => {
  await prisma.cartItem.delete({ where: { id: req.params.cartItemId } });
  res.status(204).send();
});
