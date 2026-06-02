import { Router } from 'express';
import { cartRouter } from './cart.routes.js';
import { dishRouter } from './dish.routes.js';
import { menuRouter } from './menu.routes.js';
import { orderRouter } from './order.routes.js';
import { userRouter } from './user.routes.js';

export const router = Router();

router.use('/users', userRouter);
router.use('/menus', menuRouter);
router.use('/dishes', dishRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
