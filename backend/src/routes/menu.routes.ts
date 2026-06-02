import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const menuRouter = Router();

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;

function asyncRoute(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const mealTemplates = [
  {
    mealType: 'BREAKFAST',
    title: 'Breakfast',
    sortOrder: 1
  },
  {
    mealType: 'LUNCH',
    title: 'Lunch',
    sortOrder: 2
  },
  {
    mealType: 'DINNER',
    title: 'Dinner',
    sortOrder: 3
  }
] as const;

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function setTime(date: Date, hours: number, minutes: number) {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

async function resolveActorUserId(req: Request, explicitUserId?: string) {
  if (explicitUserId) {
    return explicitUserId;
  }

  if (req.currentUserId) {
    return req.currentUserId;
  }

  const admin = await prisma.user.findFirst({
    where: {
      role: {
        code: 'ADMIN'
      }
    },
    select: {
      id: true
    }
  });

  if (admin) {
    return admin.id;
  }

  const anyUser = await prisma.user.findFirst({
    select: {
      id: true
    }
  });

  if (!anyUser) {
    throw new Error('No user found. Run database seed before creating menus.');
  }

  return anyUser.id;
}

function buildDefaultSettings(weekStartDate: Date) {
  const editingStartsAt = setTime(addDays(weekStartDate, -5), 8, 0);
  const editingEndsAt = setTime(addDays(weekStartDate, -3), 23, 59);
  const orderingStartsAt = setTime(addDays(weekStartDate, -2), 9, 0);
  const orderingEndsAt = setTime(addDays(weekStartDate, -1), 23, 59);
  const processingStartsAt = setTime(weekStartDate, 7, 0);

  return {
    editingStartsAt,
    editingEndsAt,
    orderingStartsAt,
    orderingEndsAt,
    processingStartsAt,
    parentReminderAt: orderingEndsAt,
    kitchenExportReady: false,
    visibleForParents: false,
    editableForAdmin: true
  };
}

function buildDefaultDays(weekStartDate: Date) {
  return dayNames.map((dayName, index) => ({
    dayDate: addDays(weekStartDate, index),
    dayOfWeek: dayName,
    isEnabled: true,
    sortOrder: index + 1,
    meals: {
      create: mealTemplates.map((meal) => ({
        mealType: meal.mealType,
        title: meal.title,
        isEnabled: true,
        sortOrder: meal.sortOrder
      }))
    }
  }));
}

const menuInclude = {
  settings: true,
  days: {
    orderBy: {
      sortOrder: 'asc' as const
    },
    include: {
      meals: {
        orderBy: {
          sortOrder: 'asc' as const
        },
        include: {
          menuDishes: {
            orderBy: {
              id: 'asc' as const
            },
            include: {
              dish: true
            }
          }
        }
      }
    }
  }
};

async function findFullMenu(menuId: string) {
  return prisma.menu.findUniqueOrThrow({
    where: {
      id: menuId
    },
    include: menuInclude
  });
}

const createMenuSchema = z.object({
  createdById: z.string().uuid().optional(),
  title: z.string().min(3),
  weekStartDate: z.coerce.date(),
  weekEndDate: z.coerce.date(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'CLOSED']).optional()
});

const updateMenuSchema = z.object({
  title: z.string().min(3).optional(),
  weekStartDate: z.coerce.date().optional(),
  weekEndDate: z.coerce.date().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'CLOSED']).optional()
});

const settingsSchema = z.object({
  editingStartsAt: z.coerce.date().optional(),
  editingEndsAt: z.coerce.date().optional(),
  orderingStartsAt: z.coerce.date().optional(),
  orderingEndsAt: z.coerce.date().optional(),
  processingStartsAt: z.coerce.date().optional(),
  parentReminderAt: z.coerce.date().nullable().optional(),
  kitchenExportReady: z.boolean().optional(),
  visibleForParents: z.boolean().optional(),
  editableForAdmin: z.boolean().optional()
});

const updateMenuDaySchema = z.object({
  dayDate: z.coerce.date().optional(),
  dayOfWeek: z.string().min(2).optional(),
  isEnabled: z.boolean().optional(),
  sortOrder: z.coerce.number().int().nonnegative().optional()
});

const addDishToMealSchema = z.object({
  dishId: z.string().uuid(),
  isEnabled: z.boolean().optional(),
  limitQty: z.coerce.number().int().positive().nullable().optional(),
  comment: z.string().nullable().optional()
});

const updateMenuDishSchema = z.object({
  dishId: z.string().uuid().optional(),
  isEnabled: z.boolean().optional(),
  limitQty: z.coerce.number().int().positive().nullable().optional(),
  comment: z.string().nullable().optional()
});

menuRouter.get(
  '/',
  asyncRoute(async (_req, res) => {
    const menus = await prisma.menu.findMany({
      include: menuInclude,
      orderBy: {
        weekStartDate: 'desc'
      }
    });

    res.json(menus);
  })
);

menuRouter.get(
  '/approved/current',
  asyncRoute(async (_req, res) => {
    const menu = await prisma.menu.findFirst({
      where: {
        status: 'APPROVED',
        settings: {
          visibleForParents: true
        }
      },
      include: {
        settings: true,
        days: {
          where: {
            isEnabled: true
          },
          orderBy: {
            sortOrder: 'asc'
          },
          include: {
            meals: {
              where: {
                isEnabled: true
              },
              orderBy: {
                sortOrder: 'asc'
              },
              include: {
                menuDishes: {
                  where: {
                    isEnabled: true
                  },
                  include: {
                    dish: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        weekStartDate: 'desc'
      }
    });

    if (!menu) {
      return res.status(404).json({
        message: 'Approved menu not found'
      });
    }

    res.json(menu);
  })
);

menuRouter.get(
  '/:menuId',
  asyncRoute(async (req, res) => {
    const menu = await findFullMenu(req.params.menuId);
    res.json(menu);
  })
);

menuRouter.post(
  '/',
  asyncRoute(async (req, res) => {
    const data = createMenuSchema.parse(req.body);
    const creatorId = await resolveActorUserId(req, data.createdById);
    const defaultSettings = buildDefaultSettings(data.weekStartDate);

    const menu = await prisma.menu.create({
      data: {
        createdById: creatorId,
        title: data.title,
        weekStartDate: data.weekStartDate,
        weekEndDate: data.weekEndDate,
        status: data.status ?? 'DRAFT',
        settings: {
          create: defaultSettings
        },
        days: {
          create: buildDefaultDays(data.weekStartDate)
        }
      },
      include: menuInclude
    });

    res.status(201).json(menu);
  })
);

menuRouter.patch(
  '/:menuId',
  asyncRoute(async (req, res) => {
    const data = updateMenuSchema.parse(req.body);

    await prisma.menu.update({
      where: {
        id: req.params.menuId
      },
      data
    });

    const menu = await findFullMenu(req.params.menuId);
    res.json(menu);
  })
);

menuRouter.delete(
  '/:menuId',
  asyncRoute(async (req, res) => {
    const { menuId } = req.params;

    await prisma.$transaction(async (tx) => {
      const menuDishes = await tx.menuDish.findMany({
        where: {
          meal: {
            menuDay: {
              menuId
            }
          }
        },
        select: {
          id: true
        }
      });

      const menuDishIds = menuDishes.map((item) => item.id);

      if (menuDishIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: {
            menuDishId: {
              in: menuDishIds
            }
          }
        });

        await tx.cartItem.deleteMany({
          where: {
            menuDishId: {
              in: menuDishIds
            }
          }
        });
      }

      await tx.order.deleteMany({
        where: {
          menuId
        }
      });

      await tx.cart.deleteMany({
        where: {
          menuId
        }
      });

      await tx.menu.delete({
        where: {
          id: menuId
        }
      });
    });

    res.status(204).send();
  })
);

menuRouter.post(
  '/:menuId/settings',
  asyncRoute(async (req, res) => {
    const data = settingsSchema.parse(req.body);

    const menu = await prisma.menu.findUniqueOrThrow({
      where: {
        id: req.params.menuId
      },
      include: {
        settings: true
      }
    });

    const defaults = buildDefaultSettings(menu.weekStartDate);

    await prisma.menuSettings.upsert({
      where: {
        menuId: req.params.menuId
      },
      create: {
        menuId: req.params.menuId,
        ...defaults,
        ...data
      },
      update: data
    });

    const updatedMenu = await findFullMenu(req.params.menuId);
    res.json(updatedMenu);
  })
);

menuRouter.patch(
  '/:menuId/days/:menuDayId',
  asyncRoute(async (req, res) => {
    const data = updateMenuDaySchema.parse(req.body);

    await prisma.menuDay.update({
      where: {
        id: req.params.menuDayId,
        menuId: req.params.menuId
      },
      data
    });

    const menu = await findFullMenu(req.params.menuId);
    res.json(menu);
  })
);

menuRouter.post(
  '/:menuId/meals/:mealId/dishes',
  asyncRoute(async (req, res) => {
    const data = addDishToMealSchema.parse(req.body);

    await prisma.meal.findFirstOrThrow({
      where: {
        id: req.params.mealId,
        menuDay: {
          menuId: req.params.menuId
        }
      }
    });

    const menuDish = await prisma.menuDish.create({
      data: {
        mealId: req.params.mealId,
        dishId: data.dishId,
        isEnabled: data.isEnabled ?? true,
        limitQty: data.limitQty ?? null,
        comment: data.comment ?? null
      },
      include: {
        dish: true
      }
    });

    res.status(201).json(menuDish);
  })
);

menuRouter.patch(
  '/:menuId/meals/:mealId/dishes/:menuDishId',
  asyncRoute(async (req, res) => {
    const data = updateMenuDishSchema.parse(req.body);

    await prisma.menuDish.update({
      where: {
        id: req.params.menuDishId,
        mealId: req.params.mealId
      },
      data
    });

    const menu = await findFullMenu(req.params.menuId);
    res.json(menu);
  })
);

menuRouter.delete(
  '/:menuId/meals/:mealId/dishes/:menuDishId',
  asyncRoute(async (req, res) => {
    const { menuId, mealId, menuDishId } = req.params;

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: {
          menuDishId
        }
      });

      await tx.cartItem.deleteMany({
        where: {
          menuDishId
        }
      });

      await tx.menuDish.delete({
        where: {
          id: menuDishId,
          mealId
        }
      });
    });

    const menu = await findFullMenu(menuId);
    res.json(menu);
  })
);

menuRouter.patch(
  '/:menuId/submit',
  asyncRoute(async (req, res) => {
    const submittedById = await resolveActorUserId(req);

    await prisma.menu.update({
      where: {
        id: req.params.menuId
      },
      data: {
        status: 'SUBMITTED',
        submittedById,
        submittedAt: new Date()
      }
    });

    const menu = await findFullMenu(req.params.menuId);
    res.json(menu);
  })
);

// POST /api/menus/new - создать новое меню на ближайшую неделю
menuRouter.post(
  '/new',
  asyncRoute(async (req, res) => {
    const creatorId = await resolveActorUserId(req);

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // понедельник
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const menu = await prisma.menu.create({
      data: {
        title: `Menu for ${weekStart.toDateString()}`,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        createdById: creatorId,
        status: 'DRAFT',
        settings: {
          create: buildDefaultSettings(weekStart)
        },
        days: {
          create: buildDefaultDays(weekStart) // пустые meals будут созданы
        }
      },
      include: menuInclude
    });

    res.status(201).json(menu);
  })
);

// POST /api/menus/:menuId/submit - бизнес-действие Submit
menuRouter.post(
  '/:menuId/submit',
  asyncRoute(async (req, res) => {
    const submittedById = await resolveActorUserId(req);

    await prisma.menu.update({
      where: { id: req.params.menuId },
      data: {
        status: 'SUBMITTED',
        submittedById,
        submittedAt: new Date()
      }
    });

    const menu = await findFullMenu(req.params.menuId);
    res.json(menu);
  })
);