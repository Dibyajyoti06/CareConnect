import express from "express";

const router = express.Router();
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  deleteDoctor,
  updateDoctor,
} from "../controller/doctorController.js";
import { admin, protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/multerMiddleware.js";

router.route("/").get(getDoctors).post(protect, admin, upload.single('doctorImage'),createDoctor);
router
  .route("/:id")
  .get(getDoctorById)
  .put(protect, admin, upload.single('doctorImage'), updateDoctor)
  .delete(protect, admin, deleteDoctor);

export default router;
