export type Role = {
  id: string;
  code: 'ADMIN' | 'PARENT' | 'STAFF';
  title: string;
};

export type Student = {
  id: string;
  fullName: string;
  grade: string;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  children: Student[];
};

export type Dish = {
  id: string;
  title: string;
  description?: string;
  dishType: string;
  weightGrams: number;
  priceCents: number;
};

export type MenuDish = {
  id: string;
  dish: Dish;
  isEnabled: boolean;
};

export type Meal = {
  id: string;
  title: string;
  mealType: string;
  menuDishes: MenuDish[];
};

export type MenuDay = {
  id: string;
  dayDate: string;
  dayOfWeek: string;
  isEnabled: boolean;
  meals: Meal[];
};

export type Menu = {
  id: string;
  title: string;
  status: string;
  weekStartDate: string;
  weekEndDate: string;
  days: MenuDay[];
};

export type CartItem = {
  id: string;
  quantity: number;
  menuDish: MenuDish & {
    meal: Meal & {
      menuDay: MenuDay;
    };
  };
};

export type Cart = {
  id: string;
  items: CartItem[];
};
