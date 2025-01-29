import express from 'express';
const router = express.Router();
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  createRequest,
  contributeToRequest,
  approveRequest,
  getPendingRequests,
  getApprovedRequests,
  getMyRequests,
  getMoneyRequestById,
  rejectRequest,
} from '../controller/requestMoneyController.js';

router.post('/create', protect, createRequest);

router.post('/:request_id/contribute', contributeToRequest);

router.patch('/:id/approve', admin, approveRequest);

router.patch(':id/reject', admin, rejectRequest);

router.route('/mine').get(protect, getMyRequests);

router.get('/pending', protect, admin, getPendingRequests);

router.get('/approved', getApprovedRequests);

router.route('/:id').get(protect, getMoneyRequestById);

export default router;
