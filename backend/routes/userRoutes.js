import express from 'express';
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  activeUser,
  deleteUser,
  forgetPassword,
  resetPassword,
  getUserById,
  updateUser,
  resendVerificationEmail
} from '../controller/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/auth', authUser);
router.post('/logout', logoutUser);
router.post('/forgetpassword', forgetPassword);
router.post('/resetpassword/:id/:token', resetPassword);
router.post('/resendverificationemail', resendVerificationEmail);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);
router.route('/active/:token').get(activeUser);

export default router;
