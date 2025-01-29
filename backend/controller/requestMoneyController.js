import asyncHandler from '../middleware/asyncHandler.js';
import Request from '../models/moneyModel.js';

// Create multiple funding requests from an array of requestItems
const createRequest = asyncHandler(async (req, res) => {
  try {
    const { requestItems } = req.body;

    // Check if requestItems is an array and contains at least one item
    if (!Array.isArray(requestItems) || requestItems.length === 0) {
      res.status(400);
      throw new Error('No request items provided');
    }
    const createdRequests = [];
    for (const item of requestItems) {
      const {
        patientFullName,
        dateOfBirth,
        contactInfo,
        hospitalName,
        estimatedCost,
        description,
      } = item;
      if (
        !patientFullName ||
        !dateOfBirth ||
        !contactInfo ||
        !hospitalName ||
        !estimatedCost ||
        !description
      ) {
        res.status(400);
        throw new Error('All fields are required for each request item');
      }
      const newRequest = new Request({
        user_id: req.user._id,
        patientFullName,
        dateOfBirth,
        contactInfo,
        hospitalName,
        estimatedCost,
        description,
      });

      const createdRequest = await newRequest.save();
      createdRequests.push(createdRequest);
    }

    res.status(201).json(createdRequests);
  } catch (error) {
    console.error('Error in creating requests:', error);
    res.status(500).json({ message: 'Failed to create requests', error });
  }
});
// Contribute to a request
const contributeToRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { user_id, amount } = req.body;

    const contribution = {
      contributor_id: user_id,
      amount,
    };

    const updatedRequest = await Request.findByIdAndUpdate(
      request_id,
      { $push: { contributions: contribution } },
      { new: true }
    );

    res.status(201).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Failed to contribute', error });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const status = 'approved';

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    console.log(updatedRequest);

    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update request status', error });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const status = 'rejected';

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      request_id,
      { status },
      { new: true }
    );

    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update request status', error });
  }
};

// Get all pending requests (admin view)
const getPendingRequests = async (req, res) => {
  try {
    const pendingRequests = await Request.find({ status: 'pending' });
    res.status(200).json(pendingRequests);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to fetch pending requests', error });
  }
};

// Get all approved requests
const getApprovedRequests = async (req, res) => {
  try {
    const approvedRequests = await Request.find({ status: 'approved' });

    if (!approvedRequests || approvedRequests.length === 0) {
      return res.status(404).json({ message: 'No approved requests found' });
    }

    res.status(200).json(approvedRequests);
  } catch (error) {
    res.status(500).json({
      message: 'Server error while fetching approved requests',
      error,
    });
  }
};

// Get requests created by the current user
const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ user_id: req.user._id });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user requests', error });
  }
};

const getMoneyRequestById = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (request) {
    res.status(200).json(request);
  } else {
    res.status(404);
    throw new Error('Request not found');
  }
});

export {
  createRequest,
  contributeToRequest,
  approveRequest,
  rejectRequest,
  getPendingRequests,
  getApprovedRequests,
  getMyRequests,
  getMoneyRequestById,
};
