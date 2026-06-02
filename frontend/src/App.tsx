import { Route, Routes } from 'react-router-dom';
import { AdminMenuPage } from './pages/AdminMenuPage';
import { MenuListPage } from './pages/MenuListPage';

export function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminMenuPage />} />
      <Route path="/" element={<MenuListPage />} />
    </Routes>
  );
}