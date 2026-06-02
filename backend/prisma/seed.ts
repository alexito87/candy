import { PrismaClient, MealType, MenuStatus, RoleCode } from '@prisma/client';

const prisma = new PrismaClient();

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const mealTemplates = [
  { mealType: MealType.BREAKFAST, title: 'Breakfast', sortOrder: 1 },
  { mealType: MealType.LUNCH, title: 'Lunch', sortOrder: 2 },
  { mealType: MealType.DINNER, title: 'Dinner', sortOrder: 3 }
];

const dishesData = [
  { title: 'Scrambled Eggs with Fresh Herbs', dishType: 'Main dish', weightGrams: 180, priceCents: 250, description: 'Eggs, herbs, toast' },
  { title: 'Buttermilk Pancakes with Maple Syrup', dishType: 'Main dish', weightGrams: 220, priceCents: 300, description: 'Pancakes and syrup' },
  { title: 'Greek Yogurt Parfait with Granola', dishType: 'Dessert', weightGrams: 160, priceCents: 220, description: 'Yogurt, berries, granola' },
  { title: 'Pasta Salad with Turkey', dishType: 'Main dish', weightGrams: 260, priceCents: 410, description: 'Turkey, vegetables, pasta' },
  { title: 'Vegetable Soup', dishType: 'Soup', weightGrams: 300, priceCents: 280, description: 'Seasonal vegetables' }
];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function main() {
  // очистка
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
    data: { roleId: adminRole.id, fullName: 'School Admin', email: 'admin@candy.test', phone: '+37060000001' }
  });

  const parent = await prisma.user.create({
    data: { roleId: parentRole.id, fullName: 'Liam Johnson', email: 'parent@candy.test', phone: '+37060000002' }
  });

  const student = await prisma.student.create({
    data: { parentId: parent.id, fullName: 'Emma Johnson', grade: '5C' }
  });

  // создаём справочник блюд
  const dishes = await Promise.all(dishesData.map(d => prisma.dish.create({ data: { ...d, createdById: admin.id } })));

  // создаём 10 недельных меню
  const startDate = new Date('2025-01-13T00:00:00Z');
  for (let week = 0; week < 10; week++) {
    const weekStart = addDays(startDate, week * 7);
    const menu = await prisma.menu.create({
      data: {
        createdById: admin.id,
        submittedById: admin.id,
        title: `Menu for ${weekStart.toDateString()}`,
        weekStartDate: weekStart,
        weekEndDate: addDays(weekStart, 6),
        status: MenuStatus.APPROVED,
        submittedAt: new Date(),
        settings: {
          create: {
            editingStartsAt: addDays(weekStart, -5),
            editingEndsAt: addDays(weekStart, -3),
            orderingStartsAt: addDays(weekStart, -2),
            orderingEndsAt: addDays(weekStart, -1),
            processingStartsAt: weekStart,
            parentReminderAt: addDays(weekStart, -1),
            kitchenExportReady: false,
            visibleForParents: true,
            editableForAdmin: true
          }
        },
        days: {
          create: dayNames.map((dayName, i) => ({
            dayDate: addDays(weekStart, i),
            dayOfWeek: dayName,
            isEnabled: true,
            sortOrder: i + 1,
            meals: {
              create: mealTemplates.map(meal => ({
                mealType: meal.mealType,
                title: meal.title,
                isEnabled: true,
                sortOrder: meal.sortOrder,
                menuDishes: {
                  create: dishes.slice(0, 3).map(dish => ({ dishId: dish.id, isEnabled: true }))
                }
              }))
            }
          }))
        }
      },
      include: { days: { include: { meals: { include: { menuDishes: true } } } } }
    });

    await prisma.cart.create({ data: { userId: parent.id, studentId: student.id, menuId: menu.id } });
  }

  console.log('Seed completed: 10 menus created.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });