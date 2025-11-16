import express from 'express';
import upload from '../middleware/multerMiddleware.js';
const router = express.Router();
import {
  getMedicineById,
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  createMedicineReview,
  deleteMedicineReview,
  getAllReviewsForMedicine
} from '../controller/medicineController.js';
import { admin, protect } from '../middleware/authMiddleware.js';

router.route('/').get(getMedicines).post(protect, admin, upload.single('medImage'), createMedicine);
router
  .route('/:id')
  .get(getMedicineById)
  .put(protect, admin,upload.single('medImage'), updateMedicine)
  .delete(protect, admin, deleteMedicine);
router.route('/:id/reviews')
.post(protect, createMedicineReview)
.get(protect,admin, getAllReviewsForMedicine);
router.route('/:medicineId/reviews/:reviewId').delete(protect,deleteMedicineReview);

export default router;
