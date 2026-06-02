import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const orderRouter = Router();

const createOrderSchema = z.object({
  cartId: z.string().uuid()
});

orderRouter.post('/', async (req, res) => {
  const { cartId } = createOrderSchema.parse(req.body);

  const cart = await prisma.cart.findUniqueOrThrow({
    where: { id: cartId },
    include: { items: { include: { menuDish: { include: { dish: true } } } } }
  });

  if (cart.items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  const totalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.menuDish.dish.priceCents, 0);

  const order = await prisma.order.create({
    data: {
      userId: cart.userId,
      studentId: cart.studentId,
      menuId: cart.menuId,
      totalCents,
      items: {
        create: cart.items.map((item) => ({
          menuDishId: item.menuDishId,
          quantity: item.quantity,
          priceCents: item.menuDish.dish.priceCents
        }))
      }
    },
    include: { items: { include: { menuDish: { include: { dish: true } } } } }
  });

  await prisma.cartItem.updateMany({ where: { cartId }, data: { confirmed: true } });

  res.status(201).json(order);
});

orderRouter.get('/', async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: { student: true, user: true, items: { include: { menuDish: { include: { dish: true } } } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});
