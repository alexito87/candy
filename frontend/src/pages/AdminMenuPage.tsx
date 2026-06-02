import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Dish, Menu } from '../types';
import { formatMoney } from '../utils/money';

export function AdminMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(350);

  async function loadData() {
    const [menusResponse, dishesResponse] = await Promise.all([api.get<Menu[]>('/menus'), api.get<Dish[]>('/dishes')]);
    setMenus(menusResponse.data);
    setDishes(dishesResponse.data);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createDish(event: React.FormEvent) {
    event.preventDefault();
    await api.post('/dishes', {
      title,
      dishType: 'Main dish',
      weightGrams: 250,
      priceCents: price
    });
    setTitle('');
    await loadData();
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="eyebrow">JS-1</p>
          <h1>Управление меню</h1>
          <p>Администратор школы управляет меню на неделю и доступными блюдами.</p>
        </div>
      </div>

      <div className="grid two-columns">
        <div className="card">
          <h2>Текущее меню</h2>
          {menus.map((menu) => (
            <div className="menu-card" key={menu.id}>
              <strong>{menu.title}</strong>
              <span className="badge">{menu.status}</span>
              <div className="days-list">
                {menu.days?.map((day) => (
                  <details key={day.id}>
                    <summary>{day.dayOfWeek}</summary>
                    {day.meals.map((meal) => (
                      <div className="meal-block" key={meal.id}>
                        <b>{meal.title}</b>
                        {meal.menuDishes.map((menuDish) => (
                          <p key={menuDish.id}>{menuDish.dish.title} — {formatMoney(menuDish.dish.priceCents)}</p>
                        ))}
                      </div>
                    ))}
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Добавить блюдо</h2>
          <form onSubmit={createDish} className="form-stack">
            <label>
              Название блюда
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например: Chicken Wrap" />
            </label>
            <label>
              Цена в центах
              <input type="number" value={price} onChange={(event) => setPrice(Number(event.target.value))} />
            </label>
            <button type="submit">Сохранить блюдо</button>
          </form>

          <h3>Справочник блюд</h3>
          <ul className="plain-list">
            {dishes.map((dish) => (
              <li key={dish.id}>{dish.title} — {formatMoney(dish.priceCents)}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
