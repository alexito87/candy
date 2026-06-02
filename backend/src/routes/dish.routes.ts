import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const dishRouter = Router();

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;

function asyncRoute(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const createDishSchema = z.object({
  title: z.string().min(2),
  description: z.string().nullable().optional(),
  dishType: z.string().min(2),
  weightGrams: z.coerce.number().int().positive(),
  priceCents: z.coerce.number().int().nonnegative(),
  isActive: z.boolean().optional()
});

const updateDishSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  dishType: z.string().min(2).optional(),
  weightGrams: z.coerce.number().int().positive().optional(),
  priceCents: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional()
});

dishRouter.get(
  '/',
  asyncRoute(async (_req, res) => {
    const dishes = await prisma.dish.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(dishes);
  })
);

dishRouter.post(
  '/',
  asyncRoute(async (req, res) => {
    const data = createDishSchema.parse(req.body);

    const dish = await prisma.dish.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        dishType: data.dishType,
        weightGrams: data.weightGrams,
        priceCents: data.priceCents,
        isActive: data.isActive ?? true,
        createdById: req.currentUserId
      }
    });

    res.status(201).json(dish);
  })
);

dishRouter.patch(
  '/:dishId',
  asyncRoute(async (req, res) => {
    const data = updateDishSchema.parse(req.body);

    const dish = await prisma.dish.update({
      where: {
        id: req.params.dishId
      },
      data
    });

    res.json(dish);
  })
);

dishRouter.delete(
  '/:dishId',
  asyncRoute(async (req, res) => {
    const dish = await prisma.dish.update({
      where: {
        id: req.params.dishId
      },
      data: {
        isActive: false
      }
    });

    res.json(dish);
  })
);