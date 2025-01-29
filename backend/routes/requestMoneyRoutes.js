import express from 'express';
const router = express.Router();
import {
  createRequest,
  contributeToRequest,
  approveRequest,
  getPendingRequests,
  getApprovedRequests,
} from '../controller/requestMoneyController.js';

router.post('/create', createRequest);

router.post('/:request_id/contribute', contributeToRequest);

router.patch('/:request_id/approve', approveRequest);

router.get('/pending', getPendingRequests);

router.get('/approvved', getApprovedRequests);

export default router;
