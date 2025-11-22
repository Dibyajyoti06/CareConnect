import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  getMyOrders,
  getOrderById,
  MakePayment,
  razorpayWebhook,
  updateOrderToDelivered,
  getOrders,
  cancelOrder,
} from '../controller/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/mine').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/cancel').post(protect, cancelOrder);
router.route('/:id/payment').post(protect, MakePayment);
router
  .route('/webhook')
  .post(bodyParser.raw({ type: 'application/json' }), razorpayWebhook);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

export default router;
