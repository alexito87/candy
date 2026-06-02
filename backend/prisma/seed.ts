import { PrismaClient, MealType, MenuStatus, RoleCode } from '@prisma/client';

const prisma = new PrismaClient();

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.menuDish.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.menuDay.deleteMany();
  await prisma.menuSettings.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  const adminRole = await prisma.role.create({ data: { code: RoleCode.ADMIN, title: 'School administrator' } });
  const parentRole = await prisma.role.create({ data: { code: RoleCode.PARENT, title: 'Parent' } });

  const admin = await prisma.user.create({
    data: {
      roleId: adminRole.id,
      fullName: 'School Admin',
      email: 'admin@candy.test',
      phone: '+37060000001'
    }
  });

  const parent = await prisma.user.create({
    data: {
      roleId: parentRole.id,
      fullName: 'Liam Johnson',
      email: 'parent@candy.test',
      phone: '+37060000002'
    }
  });

  const student = await prisma.student.create({
    data: {
      parentId: parent.id,
      fullName: 'Emma Johnson',
      grade: '5C'
    }
  });

  const dishes = await Promise.all([
    prisma.dish.create({ data: { createdById: admin.id, title: 'Scrambled Eggs with Fresh Herbs', dishType: 'Main dish', weightGrams: 180, priceCents: 250, description: 'Eggs, herbs, toast' } }),
    prisma.dish.create({ data: { createdById: admin.id, title: 'Buttermilk Pancakes with Maple Syrup', dishType: 'Main dish', weightGrams: 220, priceCents: 300, description: 'Pancakes and syrup' } }),
    prisma.dish.create({ data: { createdById: admin.id, title: 'Greek Yogurt Parfait with Granola', dishType: 'Dessert', weightGrams: 160, priceCents: 220, description: 'Yogurt, berries, granola' } }),
    prisma.dish.create({ data: { createdById: admin.id, title: 'Pasta Salad with Turkey', dishType: 'Main dish', weightGrams: 260, priceCents: 410, description: 'Turkey, vegetables, pasta' } }),
    prisma.dish.create({ data: { createdById: admin.id, title: 'Vegetable Soup', dishType: 'Soup', weightGrams: 300, priceCents: 280, description: 'Seasonal vegetables' } })
  ]);

  const weekStart = new Date('2025-01-13T00:00:00.000Z');
  const menu = await prisma.menu.create({
    data: {
      createdById: admin.id,
      submittedById: admin.id,
      title: 'Menu for January 13 — January 19, 2025',
      weekStartDate: weekStart,
      weekEndDate: addDays(weekStart, 6),
      status: MenuStatus.APPROVED,
      submittedAt: new Date('2025-01-10T12:00:00.000Z'),
      settings: {
        create: {
          editingStartsAt: new Date('2025-01-08T08:00:00.000Z'),
          editingEndsAt: new Date('2025-01-10T23:59:00.000Z'),
          orderingStartsAt: new Date('2025-01-11T08:00:00.000Z'),
          orderingEndsAt: new Date('2025-01-12T23:59:00.000Z'),
          processingStartsAt: new Date('2025-01-13T06:00:00.000Z'),
          parentReminderAt: new Date('2025-01-11T23:59:00.000Z'),
          visibleForParents: true,
          kitchenExportReady: false
        }
      }
    }
  });

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  for (let i = 0; i < dayNames.length; i++) {
    const day = await prisma.menuDay.create({
      data: {
        menuId: menu.id,
        dayDate: addDays(weekStart, i),
        dayOfWeek: dayNames[i],
        sortOrder: i + 1
      }
    });

    const breakfast = await prisma.meal.create({ data: { menuDayId: day.id, mealType: MealType.BREAKFAST, title: 'Breakfast', sortOrder: 1 } });
    const lunch = await prisma.meal.create({ data: { menuDayId: day.id, mealType: MealType.LUNCH, title: 'Lunch', sortOrder: 2 } });

    await prisma.menuDish.create({ data: { mealId: breakfast.id, dishId: dishes[i % 3].id } });
    await prisma.menuDish.create({ data: { mealId: breakfast.id, dishId: dishes[(i + 1) % 3].id } });
    await prisma.menuDish.create({ data: { mealId: lunch.id, dishId: dishes[3].id } });
    await prisma.menuDish.create({ data: { mealId: lunch.id, dishId: dishes[4].id } });
  }

  await prisma.cart.create({ data: { userId: parent.id, studentId: student.id, menuId: menu.id } });

  console.log('Seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
