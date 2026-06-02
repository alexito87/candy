import { useEffect, useMemo, useState } from 'react';
import { api, setDemoUser } from '../api/client';
import type { Cart, Menu, Student, User } from '../types';
import { formatMoney } from '../utils/money';

export function ParentSelectionPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);

  const totalCents = useMemo(() => {
    return cart?.items.reduce((sum, item) => sum + item.quantity * item.menuDish.dish.priceCents, 0) ?? 0;
  }, [cart]);

  async function loadInitial() {
    const usersResponse = await api.get<User[]>('/users/demo-users');
    const parent = usersResponse.data.find((user) => user.role.code === 'PARENT') ?? usersResponse.data[0];
    setUsers(usersResponse.data);
    setCurrentUser(parent);
    setDemoUser(parent.id);
    setSelectedStudent(parent.children[0] ?? null);

    const menuResponse = await api.get<Menu>('/menus/approved/current');
    setMenu(menuResponse.data);
  }

  async function loadCart(user: User | null, student: Student | null, currentMenu: Menu | null) {
    if (!user || !student || !currentMenu) return;
    const response = await api.get<Cart>('/cart', { params: { userId: user.id, studentId: student.id, menuId: currentMenu.id } });
    setCart(response.data);
  }

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    loadCart(currentUser, selectedStudent, menu);
  }, [currentUser, selectedStudent, menu]);

  async function addToCart(menuDishId: string) {
    if (!currentUser || !selectedStudent || !menu) return;
    await api.post('/cart/items', {
      userId: currentUser.id,
      studentId: selectedStudent.id,
      menuId: menu.id,
      menuDishId,
      quantity: 1
    });
    await loadCart(currentUser, selectedStudent, menu);
  }

  async function removeFromCart(cartItemId: string) {
    await api.delete(`/cart/items/${cartItemId}`);
    await loadCart(currentUser, selectedStudent, menu);
  }

  async function confirmOrder() {
    if (!cart) return;
    await api.post('/orders', { cartId: cart.id });
    alert('Заказ создан. Оплату подключим следующим этапом.');
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="eyebrow">JS-2</p>
          <h1>Выбор блюд на неделю</h1>
          <p>Родитель выбирает блюда из утверждённого меню и добавляет их в корзину.</p>
        </div>
      </div>

      <div className="toolbar card">
        <label>
          Демо-пользователь
          <select
            value={currentUser?.id ?? ''}
            onChange={(event) => {
              const user = users.find((item) => item.id === event.target.value) ?? null;
              setCurrentUser(user);
              if (user) setDemoUser(user.id);
              setSelectedStudent(user?.children[0] ?? null);
            }}
          >
            {users.map((user) => <option value={user.id} key={user.id}>{user.fullName} — {user.role.code}</option>)}
          </select>
        </label>

        <label>
          Ребёнок
          <select value={selectedStudent?.id ?? ''} onChange={(event) => setSelectedStudent(currentUser?.children.find((child) => child.id === event.target.value) ?? null)}>
            {currentUser?.children.map((child) => <option value={child.id} key={child.id}>{child.fullName} — {child.grade}</option>)}
          </select>
        </label>
      </div>

      <div className="grid menu-layout">
        <div className="card">
          <h2>{menu?.title ?? 'Меню не найдено'}</h2>
          {menu?.days.map((day) => (
            <details open key={day.id} className="day-section">
              <summary>{day.dayOfWeek}</summary>
              {day.meals.map((meal) => (
                <div key={meal.id} className="meal-block">
                  <h3>{meal.title}</h3>
                  <div className="dish-list">
                    {meal.menuDishes.map((menuDish) => (
                      <article className="dish-card" key={menuDish.id}>
                        <div>
                          <strong>{menuDish.dish.title}</strong>
                          <p>{menuDish.dish.description}</p>
                          <span>{menuDish.dish.weightGrams} г · {formatMoney(menuDish.dish.priceCents)}</span>
                        </div>
                        <button onClick={() => addToCart(menuDish.id)}>В корзину</button>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </details>
          ))}
        </div>

        <aside className="card cart-card">
          <h2>Корзина</h2>
          {cart?.items.length ? cart.items.map((item) => (
            <div className="cart-item" key={item.id}>
              <div>
                <strong>{item.menuDish.dish.title}</strong>
                <p>{item.quantity} × {formatMoney(item.menuDish.dish.priceCents)}</p>
              </div>
              <button className="secondary" onClick={() => removeFromCart(item.id)}>Удалить</button>
            </div>
          )) : <p>Пока ничего не выбрано.</p>}

          <div className="cart-total">
            <span>Итого</span>
            <strong>{formatMoney(totalCents)}</strong>
          </div>
          <button disabled={!cart?.items.length} onClick={confirmOrder}>Подтвердить выбор</button>
        </aside>
      </div>
    </section>
  );
}
