export type RoleCode = 'ADMIN' | 'PARENT' | 'STAFF';

export type MenuStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CLOSED';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export type Role = {
  id: string;
  code: RoleCode;
  title: string;
  description?: string | null;
};

export type Student = {
  id: string;
  parentId?: string;
  fullName: string;
  grade: string;
  createdAt?: string;
  updatedAt?: string;
};

export type User = {
  id: string;
  roleId?: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: Role;
  children: Student[];
  createdAt?: string;
  updatedAt?: string;
};

export type Dish = {
  id: string;
  createdById?: string | null;
  title: string;
  description?: string | null;
  dishType: string;
  weightGrams: number;
  priceCents: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MenuSettings = {
  id: string;
  menuId: string;
  editingStartsAt: string;
  editingEndsAt: string;
  orderingStartsAt: string;
  orderingEndsAt: string;
  processingStartsAt: string;
  parentReminderAt?: string | null;
  kitchenExportReady: boolean;
  visibleForParents: boolean;
  editableForAdmin: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MenuDish = {
  id: string;
  mealId?: string;
  dishId?: string;
  dish: Dish;
  isEnabled: boolean;
  limitQty?: number | null;
  comment?: string | null;
};

export type Meal = {
  id: string;
  menuDayId?: string;
  title: string;
  mealType: MealType;
  isEnabled: boolean;
  sortOrder: number;
  menuDishes: MenuDish[];
};

export type MenuDay = {
  id: string;
  menuId?: string;
  dayDate: string;
  dayOfWeek: string;
  isEnabled: boolean;
  sortOrder: number;
  meals: Meal[];
};

export type Menu = {
  id: string;
  createdById?: string;
  submittedById?: string | null;
  title: string;
  status: MenuStatus;
  weekStartDate: string;
  weekEndDate: string;
  submittedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  settings?: MenuSettings | null;
  days: MenuDay[];
};

export type CartItem = {
  id: string;
  cartId?: string;
  menuDishId?: string;
  quantity: number;
  confirmed: boolean;
  menuDish: MenuDish & {
    meal: Meal & {
      menuDay: MenuDay;
    };
  };
};

export type Cart = {
  id: string;
  userId?: string;
  studentId?: string;
  menuId?: string;
  items: CartItem[];
};
