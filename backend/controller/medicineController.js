import asyncHandler from '../middleware/asyncHandler.js';
import upload from '../middleware/multerMiddleware.js';
import Medicine from '../models/medModel.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import uploadonCloudinary from '../utils/cloudinary.js';

const getMedicines = asyncHandler(async (req, res) => {
  const meds = await Medicine.find({}).sort({ createdAt: -1 });
  res.json(new ApiResponse(200, meds, 'Medicines fetched successfully'));
});

const getMedicineById = asyncHandler(async (req, res) => {
  const med = await Medicine.findById(req.params.id);

  if(!med) {
    throw new ApiError(404, 'Medicine Not Found');
  }
    return res.json(new ApiResponse(200, med, 'Medicine fetched successfully'));
});

const createMedicine = asyncHandler(async (req, res) => {

  const { name, price, description, brand, category, countInStock } = req.body;

  if ([name, price, description, brand, category, countInStock].some(
    field => field === undefined || field === null || (typeof field === 'string' && field.trim() === '')
  ) || !req.file?.path) {
    throw new ApiError(400, 'All fields are required');
  }

  const medicineImagePath = req.file.path;

  const medImage = await uploadonCloudinary(medicineImagePath);

  if(!medImage?.url) {
    throw new ApiError(500, 'Medicine image upload failed');
  } 

  const med = new Medicine({
    name,
    price:Number(price),
    uploadedBy: req.user._id,
    image: medImage.url,
    brand,
    category,
    countInStock:Number(countInStock),
    numReviews: 0,
    description,
  });

  const createdMedicine = await med.save();
  res.json(new ApiResponse(201, createdMedicine, 'Medicine created successfully'));

});

const updateMedicine = asyncHandler(async (req, res) => {
  const { name, price, description, brand, category, countInStock } = req.body;

  const med = await Medicine.findById(req.params.id);

  if(!med) {
    throw new ApiError(404, 'Medicine Not Found');
  }

  const isEmpty = (value) =>
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

  const fields ={ name, price, description, brand, category, countInStock };
  const hasUploadedImage = !!req.file?.path?.length;

  if(Object.values(fields).every(isEmpty) && !hasUploadedImage) {
    throw new ApiError(400, 'At least one field must be provided for update');
  }

  if(hasUploadedImage) {
    const medicineImagePath = req.file.path;

    const medImage = await uploadonCloudinary(medicineImagePath);

    if(!medImage?.url) {
      throw new ApiError(500, 'Medicine image upload failed');
    } 

    med.image = medImage.url;
  }

  Object.entries(fields).forEach(([key, value]) => {
    if(value===undefined) return;

    if(isEmpty(value)){
      throw new ApiError(400, `Invalid value for field: ${key}`);
    }
    med[key] = ['price', 'countInStock'].includes(key) ? Number(value) : value;
  });

    const updatedMedicine = await med.save();
    res.json(new ApiResponse(200, updatedMedicine, 'Medicine updated successfully'));
  
});

const deleteMedicine = asyncHandler(async (req, res) => {
  const med = await Medicine.findById(req.params.id);

  if(!med) {
    throw new ApiError(404, 'Medicine Not Found');
  }
  await Medicine.deleteOne({ _id: med._id });
  res.json(new ApiResponse(200, null, 'Medicine deleted successfully'));

});

const createMedicineReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if([rating, comment].some(
    field => field === undefined || (typeof field === 'string' && field.trim() === ''))
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  if (Number(rating) < 1 || Number(rating) > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
}

  const med = await Medicine.findById(req.params.id);

  if(!med) {
    throw new ApiError(404, 'Medicine Not Found');
  }

  const alreadyReviewed = med.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    throw new ApiError(400, 'Medicine already reviewed');
  }

  const review = {
    reviewerName: req.user.name,
    rating: Number(rating),
    comment,
    reviewerId: req.user._id,
  };

  med.reviews.push(review);

  med.numReviews = med.reviews.length;

  med.rating =
  med.reviews.length > 0
    ? Number(
        (med.reviews.reduce((acc, item) => acc + item.rating, 0) / med.reviews.length).toFixed(2)
      )
    : 0;

  await med.save();
  res.status(201).json(new ApiResponse(201, null, 'Review added'));
});

const deleteMedicineReview = asyncHandler(async (req, res) => {
  const { medicineId, reviewId } = req.params;

  const med = await Medicine.findById(medicineId);

  if (!med) {
    throw new ApiError(404, 'Medicine Not Found');
  }

  const review = med.reviews.find(
    (r) => r.reviewerId.toString() === reviewId.toString()
  );

  if (!review) {
    throw new ApiError(404, 'Review Not Found');
  }

  // Check if user is owner of review or admin
  if (
    review.reviewerId.toString() !== req.user._id.toString() && // not owner
    !req.user.isAdmin // not admin
  ) {
    throw new ApiError(403, 'You are not authorized to delete this review');
  }

  // Remove the review
  med.reviews = med.reviews.filter(
    (r) => r.reviewerId.toString() !== reviewId.toString()
  );

  // Update numReviews and rating
  med.numReviews = med.reviews.length;

  med.rating =
  med.reviews.length > 0
    ? Number(
        (med.reviews.reduce((acc, item) => acc + item.rating, 0) / med.reviews.length).toFixed(2)
      )
    : 0;

  await med.save();

  res.json(new ApiResponse(200, null, 'Review deleted successfully'));
});

const getAllReviewsForMedicine = asyncHandler(async (req, res) => {
  const med = await Medicine.findById(req.params.id);

  if (!med) {
    throw new ApiError(404, 'Medicine Not Found');
  }
  res.json(new ApiResponse(200, med.reviews, 'Reviews fetched successfully'));
});

export {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  createMedicineReview,
  deleteMedicineReview,
  getAllReviewsForMedicine
};
