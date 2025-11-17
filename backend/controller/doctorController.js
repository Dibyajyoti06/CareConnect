import asyncHandler from '../middleware/asyncHandler.js';
import Doctor from '../models/doctorModel.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import uploadonCloudinary from '../utils/cloudinary.js';

const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({}).sort({ createdAt: -1 });
  res.json(new ApiResponse(200, doctors, 'Doctors fetched successfully'));
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if(!doctor) {
    throw new ApiError(404, 'Doctor Not Found');
  }
  return res.json(new ApiResponse(200,doctor,'Doctor fetched successfully'));
});

const createDoctor = asyncHandler(async (req, res) => {
  
  const isInvalid = (value) => {

  if(value === null || value === undefined) return true;

  if (Array.isArray(value)) {
    return (
      value.length === 0 ||
      value.some((v) => typeof v !== "string" || v.trim() === "")
    );
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }
  return true;
  };

  const { name, degree, specialization, chamber, tag, available } = req.body;
  const degreeArray = Array.isArray(degree) ? degree : JSON.parse(degree || '[]');
  const tagArray = Array.isArray(tag) ? tag : JSON.parse(tag || '[]');
  
  if(Object.values({ name, degreeArray, specialization, chamber, tagArray, available }).some(isInvalid) || 
  !req.file?.path) {
    throw new ApiError(400, 'All fields are required and must be valid');
  }

  const exists = await Doctor.findOne({
  name,
  specialization,
  chamber
  });
  
  if (exists) {
    throw new ApiError(400, "Doctor already exists");
  }


  const doctorImagePath = req.file.path;

  const doctorImage = await uploadonCloudinary(doctorImagePath);

  if(!doctorImage?.url) {
    throw new ApiError(500, 'Doctor image upload failed');
  }

  const doctor = new Doctor({
    name,
    createdBy: req.user._id,
    image: doctorImage.url,
    degree: degreeArray,
    specialization,
    chamber,
    tag: tagArray,
    available,
  });

  const createdDoctor = await doctor.save();
  res.json(new ApiResponse(201, createdDoctor, 'Doctor created successfully'));

});

const updateDoctor = asyncHandler(async (req, res) => {

  const isInvalid = (value) => {

    if (value === null || value === undefined) return true;
    
    if (Array.isArray(value)) {
      return (
        value.length === 0 ||
        value.some((v) => typeof v !== "string" || v.trim() === "")
      );
    }

    if(typeof value === "string") {
      return value.trim() === "";
    }
    return false;
  };

  const { name, degree, specialization, chamber, tag, available } = req.body;

  const doctor = await Doctor.findById(req.params.id);

  if(!doctor) {
    throw new ApiError(404, 'Doctor Not Found');
  }
  
  const fields = { name, degree, specialization, chamber, tag, available };
  const hasUploadedImage = !!req.file?.path?.length;
  
  if(Object.values(fields).every(v => isInvalid(v)) && !hasUploadedImage) {
    throw new ApiError(400, "At least one field is required to update");
  }
  
  if(hasUploadedImage) {
    const doctorImagePath = req.file.path;

    if(doctorImagePath) {
      const doctorImage = await uploadonCloudinary(doctorImagePath);

      if(!doctorImage?.url) {
        throw new ApiError(500, 'Doctor image upload failed');
      }

      doctor.image = doctorImage.url;
    }
  }
  Object.entries(fields).forEach(([key, value]) => {
    if(value===undefined) return; // Skip undefined values

    if (isInvalid(value)) {
      throw new ApiError(400, `Invalid value for field: ${key}`);
    }
    //Field is valid, proceed to update
    doctor[key] = value;
  });

  const updatedDoctor = await doctor.save();
  res.json(new ApiResponse(200, updatedDoctor, 'Doctor updated successfully'));
  
});

const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if(!doctor) {
    throw new ApiError(404, 'Doctor Not Found');
  }

  await Doctor.deleteOne({ _id: doctor._id });
  res.json(new ApiResponse(200, null, 'Doctor deleted successfully'));
});

export { getDoctors, getDoctorById, createDoctor, deleteDoctor, updateDoctor };
