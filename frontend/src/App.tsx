import { NavLink, Route, Routes } from 'react-router-dom';
import { AdminMenuPage } from './pages/AdminMenuPage';
import { ParentSelectionPage } from './pages/ParentSelectionPage';

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">🍬 CANDY</div>
        <nav>
          <NavLink to="/">Выбор блюд</NavLink>
          <NavLink to="/admin">Администрирование меню</NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<ParentSelectionPage />} />
          <Route path="/admin" element={<AdminMenuPage />} />
        </Routes>
      </main>
    </div>
  );
}
