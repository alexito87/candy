import { MealType, MenuStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const menuRouter = Router();

const createMenuSchema = z.object({
  createdById: z.string().uuid().optional(),
  title: z.string().min(3),
  weekStartDate: z.coerce.date(),
  weekEndDate: z.coerce.date()
});

const addDishToMealSchema = z.object({
  dishId: z.string().uuid()
});

menuRouter.get('/', async (_req, res) => {
  const menus = await prisma.menu.findMany({
    include: { settings: true, days: { include: { meals: { include: { menuDishes: { include: { dish: true } } } } } } },
    orderBy: { weekStartDate: 'desc' }
  });
  res.json(menus);
});

menuRouter.get('/approved/current', async (_req, res) => {
  const menu = await prisma.menu.findFirst({
    where: { status: MenuStatus.APPROVED, settings: { visibleForParents: true } },
    include: {
      settings: true,
      days: {
        orderBy: { sortOrder: 'asc' },
        include: {
          meals: {
            orderBy: { sortOrder: 'asc' },
            include: { menuDishes: { where: { isEnabled: true }, include: { dish: true } } }
          }
        }
      }
    },
    orderBy: { weekStartDate: 'desc' }
  });

  if (!menu) return res.status(404).json({ message: 'Approved menu not found' });
  res.json(menu);
});

menuRouter.post('/', async (req, res) => {
  const data = createMenuSchema.parse(req.body);
  const creator = data.createdById ?? req.currentUserId;
  if (!creator) return res.status(400).json({ message: 'createdById is required for now' });

  const menu = await prisma.menu.create({
    data: {
      createdById: creator,
      title: data.title,
      weekStartDate: data.weekStartDate,
      weekEndDate: data.weekEndDate
    }
  });
  res.status(201).json(menu);
});

menuRouter.patch('/:menuId/submit', async (req, res) => {
  const menu = await prisma.menu.update({
    where: { id: req.params.menuId },
    data: { status: MenuStatus.APPROVED, submittedById: req.currentUserId, submittedAt: new Date() }
  });
  res.json(menu);
});

menuRouter.post('/:menuId/days/:menuDayId/meals/:mealId/dishes', async (req, res) => {
  const data = addDishToMealSchema.parse(req.body);
  const menuDish = await prisma.menuDish.create({ data: { mealId: req.params.mealId, dishId: data.dishId } });
  res.status(201).json(menuDish);
});

menuRouter.patch('/menu-dishes/:menuDishId/toggle', async (req, res) => {
  const current = await prisma.menuDish.findUniqueOrThrow({ where: { id: req.params.menuDishId } });
  const updated = await prisma.menuDish.update({ where: { id: current.id }, data: { isEnabled: !current.isEnabled } });
  res.json(updated);
});
