import { Request, Response } from 'express';
import prisma from '../prisma/client';

// POST /orders
export async function createOrder(req: Request, res: Response) {
  const { cartId } = req.body;
  const userId = req.currentUserId;

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true }
  });

  if (!cart) return res.status(404).json({ error: 'Cart not found' });

  const order = await prisma.order.create({
    data: {
      userId,
      studentId: cart.studentId,
      menuId: cart.menuId,
      sourceCartId: cart.id,
      status: 'SUBMITTED',
      totalCents: cart.items.reduce((sum, i) => sum + i.quantity * i.menuDish.priceCents, 0),
      expiresAt: new Date(Date.now() + 24*60*60*1000) // пример 1 день жизни заказа
    }
  });

  // Копируем CartItems → OrderItems
  for (const item of cart.items) {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        menuDishId: item.menuDishId,
        quantity: item.quantity,
        priceCents: item.menuDish.priceCents
      }
    });
  }

  res.json(order);
}

// DELETE /orders/:orderId
export async function deleteOrder(req: Request, res: Response) {
  const { orderId } = req.params;
  await prisma.orderItem.deleteMany({ where: { orderId } });
  await prisma.order.delete({ where: { id: orderId } });
  res.json({ success: true });
}

// GET /orders/:orderId
export async function getOrder(req: Request, res: Response) {
  const { orderId } = req.params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: { include: { menuDish: true } },
      student: true,
      menu: true
    }
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
}