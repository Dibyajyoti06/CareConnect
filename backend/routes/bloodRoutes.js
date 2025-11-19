import express from 'express';
const router = express.Router();

import {
  getBloodById,
  getBloods,
  createBlood,
  updateBlood,
  deleteBlood,
} from '../controller/bloodController.js';
import upload from '../middleware/multerMiddleware.js';
import { admin, protect } from '../middleware/authMiddleware.js';

router
  .route('/')
  .get(getBloods)
  .post(protect, admin, upload.single('bloodImage'), createBlood);
router
  .route('/:id')
  .get(protect, getBloodById)
  .put(protect, admin, upload.single('bloodImage'), updateBlood)
  .delete(protect, admin, deleteBlood);

export default router;
