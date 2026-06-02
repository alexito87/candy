import { Router } from 'express';
import { createOrder, deleteOrder, getOrder } from '../controllers/order.controller';
import { requireUser } from '../middlewares/auth.middleware';

const router = Router();

// Создание нового заказа из корзины
router.post('/', requireUser, createOrder);

// Удаление заказа
router.delete('/:orderId', requireUser, deleteOrder);

// Просмотр заказа
router.get('/:orderId', requireUser, getOrder);

export default router;