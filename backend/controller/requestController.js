import asyncHandler from '../middleware/asyncHandler.js';
import RequestBlood from '../models/requestModel.js';

const addRequestDonor = asyncHandler(async (req, res) => {
  const { requestItems } = req.body;
  if (requestItems && requestItems === 0) {
    res.status(400);
    throw new Error('No Donor items');
  } else {
    const request = new RequestBlood({
      requestItems: requestItems.map((x) => ({
        ...x,
      })),
      user: req.user._id,
    });
    const createdRequest = await request.save();
    res.status(201).json(createdRequest);
  }
});

const availableDonor = asyncHandler(async (req, res) => {
  const { availableDonor } = req.body;

  const request = await RequestBlood.findByIdAndUpdate(
    req.body.id,
    { $push: { availableDonor: { number: availableDonor } } },
    { new: true }
  );

  if (request) {
    res.status(201).json(request);
  } else {
    res.status(404);
    throw new Error('Request not found');
  }
});

const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await RequestBlood.find({ user: req.user._id });
  res.status(200).json(requests);
});

const getRequestById = asyncHandler(async (req, res) => {
  const request = await RequestBlood.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (request) {
    res.status(200).json(request);
  } else {
    res.status(404);
    throw new Error('Request not found');
  }
});

const updateRequestToApproved = asyncHandler(async (req, res) => {
  const request = await RequestBlood.findById(req.params.id);

  if (request) {
    request.isApproved = true;
    request.ApprovedAt = Date.now();

    const updatedRequest = await request.save();

    res.json(updatedRequest);
  } else {
    res.status(404);
    throw new Error('Request not found');
  }
});

const getRequests = asyncHandler(async (req, res) => {
  const requests = await RequestBlood.find({}).populate('user', 'id name');
  res.json(requests);
});

export {
  addRequestDonor,
  getMyRequests,
  getRequestById,
  getRequests,
  updateRequestToApproved,
  availableDonor,
};
