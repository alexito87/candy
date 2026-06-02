import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const dishRouter = Router();

const createDishSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  dishType: z.string().min(2),
  weightGrams: z.coerce.number().int().positive(),
  priceCents: z.coerce.number().int().nonnegative()
});

dishRouter.get('/', async (_req, res) => {
  const dishes = await prisma.dish.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(dishes);
});

dishRouter.post('/', async (req, res) => {
  const data = createDishSchema.parse(req.body);
  const dish = await prisma.dish.create({ data: { ...data, createdById: req.currentUserId } });
  res.status(201).json(dish);
});
