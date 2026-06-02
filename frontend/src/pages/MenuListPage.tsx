import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Menu } from '../types';
import '../styles/MenuListPage.css';

export function MenuListPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  async function loadMenus() {
    setIsLoading(true);
    try {
      const response = await api.get<Menu[]>('/menus');
      setMenus(response.data);
    } finally {
      setIsLoading(false);
    }
  }

  async function createNewMenu() {
    const response = await api.post<Menu>('/menus/new');
    const menu = response.data;

    // Перейти на страницу редактирования созданного меню
    navigate(`/admin?menuId=${menu.id}`);
  }

  useEffect(() => {
    loadMenus();
  }, []);

  return (
    <main className="menu-list-page">
      <header className="menu-list-header">
        <h1>School Menus</h1>
        <button onClick={createNewMenu}>+ Create New Menu</button>
      </header>

      {isLoading && <p>Loading menus...</p>}

      {!isLoading && menus.length === 0 && <p>No menus found.</p>}

      {!isLoading && menus.length > 0 && (
        <table className="menu-list-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Week Start</th>
              <th>Week End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((menu) => (
              <tr key={menu.id}>
                <td>{menu.title}</td>
                <td>{new Date(menu.weekStartDate).toLocaleDateString()}</td>
                <td>{new Date(menu.weekEndDate).toLocaleDateString()}</td>
                <td>{menu.status}</td>
                <td>
                  <button onClick={() => navigate(`/admin?menuId=${menu.id}`)}>Open / Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}