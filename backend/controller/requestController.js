import asyncHandler from '../middleware/asyncHandler.js';
import RequestBlood from '../models/requestModel.js';
import Blood from '../models/bloodModel.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const addRequestDonor = asyncHandler(async (req, res) => {
  const { requestItems } = req.body;
  if (!requestItems || typeof requestItems !== 'object') {
    throw new ApiError(
      404,
      'Invalid request format. requestItems must be an object'
    );
  }

  let existingRequest = await RequestBlood.findOne({ requestBy: req.user._id });

  if (existingRequest) {
    const alreadyExists = existingRequest.requestItems.some((item) => {
      return (
        item.patientName?.trim().toLowerCase() ===
          requestItems.patientName?.trim().toLowerCase() &&
        item.contactInfo?.countryCode ===
          requestItems.contactInfo?.countryCode &&
        item.contactInfo?.phoneNumber === requestItems.contactInfo?.phoneNumber
      );
    });

    if (alreadyExists) {
      throw new ApiError(
        400,
        `Request for patient "${requestItems.patientName}" with phone ${requestItems.contactInfo?.countryCode}${requestItems.contactInfo?.phoneNumber} already exists`
      );
    }

    const updatedRequest = await RequestBlood.findOneAndUpdate(
      { requestBy: req.user._id },
      { $push: { requestItems: requestItems } },
      { new: true }
    );
    return res.json(
      new ApiResponse(200, updatedRequest, 'Request added to existing user')
    );
  }
  const newRequest = new RequestBlood({
    requestBy: req.user._id,
    requestItems: [requestItems],
  });
  const createdRequest = await newRequest.save();
  res.json(
    new ApiResponse(201, createdRequest, 'New request created successfully')
  );
});

const availableDonor = asyncHandler(async (req, res) => {
  const { requestId, contactInfo, status, requestItemId } = req.body;

  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!status || !validStatuses.includes(status)) {
    throw new ApiError(400, 'Status is required and must be valid.');
  }

  if (!requestId || !requestItemId) {
    throw new ApiError(400, 'Request ID & requestItemId both are required.');
  }

  if (!contactInfo?.countryCode || !contactInfo?.phoneNumber) {
    throw new ApiError(400, 'Country code and phone number are required.');
  }

  const donor = await Blood.findOne({
    'contactInfo.countryCode': contactInfo.countryCode.trim(),
    'contactInfo.phoneNumber': contactInfo.phoneNumber.trim(),
  });

  if (!donor) {
    throw new ApiError(404, 'Donor not found.');
  }

  const setFields = {
    'requestItems.$.assignedDonor': donor._id,
    'requestItems.$.status': status,
  };

  if (status === 'approved') {
    setFields['requestItems.$.approvedAt'] = new Date();
  }

  const updatedRequest = await RequestBlood.findOneAndUpdate(
    {
      _id: requestId,
      'requestItems._id': requestItemId,
      'requestItems.assignedDonor': null,
    },
    { $set: setFields },
    { new: true }
  ).populate(
    'requestItems.assignedDonor',
    '-_id -createdBy -createdAt -updatedAt -__v'
  );

  if (!updatedRequest) {
    throw new ApiError(404, 'Request not found or Donor already assigned.');
  }

  res.json(
    new ApiResponse(200, updatedRequest, 'Donor assigned successfully.')
  );
});

const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await RequestBlood.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.json(
    new ApiResponse(200, requests, 'User Requests fetched successfully')
  );
});

const getRequestById = asyncHandler(async (req, res) => {
  const request = await RequestBlood.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }
  res
    .status(200)
    .json(new ApiResponse(200, request, 'Request fetched successfully'));
});

const updateRequestToApproved = asyncHandler(async (req, res) => {
  const { status } = req.body;
  // Validate status
  if (!status) {
    throw new ApiError(400, 'Status is required');
  }

  const request = await RequestBlood.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  // Only allow valid statuses
  const validStatuses = ['pending', 'approved', 'rejected'];

  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid request status');
  }

  request.status = status;
  if (status === 'approved') {
    request.approvedAt = Date.now();
  }

  const updatedRequest = await request.save();
  res.json(
    new ApiResponse(200, updatedRequest, 'Request updated successfully')
  );
});

const getRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  const allowedStatuses = ['pending', 'approved', 'rejected'];

  if (status && allowedStatuses.includes(status.toLowerCase())) {
    filter.status = status.toLowerCase();
  }

  const requests = await RequestBlood.find(filter).populate('user', 'id name');

  res.json(new ApiResponse(200, requests, 'Requests fetched successfully'));
});

export {
  addRequestDonor,
  getMyRequests,
  getRequestById,
  getRequests,
  updateRequestToApproved,
  availableDonor,
};
