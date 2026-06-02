// frontend/src/api/client.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
});

// Добавляем interceptor, чтобы автоматически передавать x-user-id
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('currentUserId');
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
});

// Order
export const getOrder = (orderId: string) => api.get(`/orders/${orderId}`);
export const createOrder = (cartId: string) => api.post(`/orders`, { cartId });
export const deleteOrder = (orderId: string) => api.delete(`/orders/${orderId}`);

// Menu
export const getMenus = () => api.get('/menus');
export const createMenu = (menuData: any) => api.post('/menus', menuData);

// Cart
export const getCart = (cartId: string) => api.get(`/cart/${cartId}`);
export const updateCartItem = (cartItemId: string, data: any) =>
  api.patch(`/cart/items/${cartItemId}`, data);

// Demo user helper (для выбора пользователя при тесте)
export const setDemoUser = (userId: string) => {
  localStorage.setItem('currentUserId', userId);
};