import asyncHandler from '../middleware/asyncHandler.js';
import Blood from '../models/bloodModel.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import uploadonCloudinary from '../utils/cloudinary.js';

const getBloods = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          {
            group: { $regex: req.query.keyword, $options: 'i' },
          },
        ],
      }
    : {};

  const bloods = await Blood.find({ ...keyword });
  res.json(new ApiResponse(200, bloods, 'Bloods fetched successfully'));
});

const getBloodById = asyncHandler(async (req, res) => {
  const blood = await Blood.findById(req.params.id);

  if (!blood) {
    throw new ApiError(404, 'Blood not found');
  }
  res.json(new ApiResponse(200, blood, 'Blood fetched successfully'));
});

const createBlood = asyncHandler(async (req, res) => {
  const { name, group, lastdonate, age, address, contactInfo } = req.body;

  const checkStringFields = [name, group, address].some(
    (field) => typeof field !== 'string' || field.trim() === ''
  );
  const checkNumberFields = [age].some(
    (field) =>
      field === undefined ||
      field === null ||
      isNaN(field) ||
      Number(field) <= 0
  );
  const checkDateFields = !lastdonate || isNaN(new Date(lastdonate).getTime());
  const contactInfoFields =
    !contactInfo ||
    typeof contactInfo.countryCode !== 'string' ||
    contactInfo.countryCode.trim() === '' ||
    typeof contactInfo.phoneNumber !== 'string' ||
    contactInfo.phoneNumber.trim() === '';

  if (
    checkStringFields ||
    checkNumberFields ||
    checkDateFields ||
    contactInfoFields ||
    !req.file?.path
  ) {
    throw new ApiError(400, 'All fields are required and must be valid');
  }

  const exists = await Blood.findOne({
    'contactInfo.phoneNumber': contactInfo.phoneNumber.trim(),
  });

  if (exists) {
    throw new ApiError(400, 'A donor with this phone number already exists');
  }

  const bloodImagePath = req.file.path;
  const bloodImage = await uploadonCloudinary(bloodImagePath);
  if (!bloodImage?.url) {
    throw new ApiError(500, 'Blood image upload failed');
  }

  const blood = new Blood({
    name,
    createdBy: req.user._id,
    image: bloodImage.url,
    group,
    lastdonate,
    age,
    address,
    contactInfo,
  });

  const createdBlood = await blood.save();
  res.json(new ApiResponse(201, createdBlood, 'Blood created successfully'));
});

const updateBlood = asyncHandler(async (req, res) => {
  const { name, image, group, lastdonate, age, address, contactInfo } =
    req.body;

  const blood = await Blood.findById(req.params.id);
  if (!blood) {
    throw new ApiError(404, 'Blood not found');
  }
  const hasUploadedImage = !!req.file?.path;

  const hasAtLeastOneField =
    name !== undefined ||
    group !== undefined ||
    lastdonate !== undefined ||
    age !== undefined ||
    address !== undefined ||
    contactInfo !== undefined ||
    hasUploadedImage;

  if (!hasAtLeastOneField) {
    throw new ApiError(400, 'At least one field is required to update');
  }

  if (hasUploadedImage) {
    const bloodImagePath = req.file.path;

    if (bloodImagePath) {
      const bloodImage = await uploadonCloudinary(bloodImagePath);

      if (!bloodImage?.url) {
        throw new ApiError(500, 'Blood image upload failed');
      }
      blood.image = bloodImage.url;
    }
  }

  const fields = { name, group, lastdonate, age, address, contactInfo };

  const validators = {
    name: (v) => typeof v === 'string' && v.trim() !== '',
    group: (v) => typeof v === 'string' && v.trim() !== '',
    address: (v) => typeof v === 'string' && v.trim() !== '',
    age: (v) => !isNaN(v) && Number(v) > 0,
    lastdonate: (v) => !isNaN(new Date(v).getTime()),
    contactInfo: (v) =>
      v &&
      /^\+\d{1,3}$/.test(v.countryCode?.trim()) &&
      /^\d{10}$/.test(v.phoneNumber?.trim()),
  };

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return; // skip un-updated fields

    if (!validators[key]) {
      throw new ApiError(400, `No validator defined for field: ${key}`);
    }

    if (!validators[key](value)) {
      throw new ApiError(400, `Invalid value for field: ${key}`);
    }

    blood[key] = value;
  });

  const updatedBlood = await blood.save();
  res.json(new ApiResponse(200, updatedBlood, 'Blood updated successfully'));
});

const deleteBlood = asyncHandler(async (req, res) => {
  const blood = await Blood.findById(req.params.id);
  if (!blood) {
    throw new ApiError(404, 'Blood not found');
  }
  await Blood.deleteOne({ _id: blood._id });
  res.json(new ApiResponse(200, null, 'Donor removed successfully'));
});

export { getBloods, getBloodById, createBlood, updateBlood, deleteBlood };
