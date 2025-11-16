import asyncHandler from '../middleware/asyncHandler.js';
import Appointment from '../models/appointmentModel.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const addAppointmentItems = asyncHandler(async (req, res) => {

  const { appointmentItems, location, time } = req.body;

  const isAppointmentItemsValid = (
  appointmentItems &&
  Array.isArray(appointmentItems) &&
  appointmentItems.length > 0 &&
  appointmentItems.every(item => item && typeof item === 'object')
  );
  const isLocationValid =(
    typeof location?.address === "string" &&
    location.address.trim().length > 0 &&

    typeof location?.contactInfo?.countryCode === "string" &&
    location.contactInfo.countryCode.trim().length > 0 &&

    typeof location?.contactInfo?.phoneNumber === "string" &&
    location.contactInfo.phoneNumber.trim().length > 0);

  const isTimeValid = (time && !isNaN(new Date(time).getTime()));

  if (!isAppointmentItemsValid || !isLocationValid || !isTimeValid) {
    throw new ApiError(400, 'All fields are required and must be valid');
  }

  const desiredTime = new Date(time);
  desiredTime.setSeconds(0, 0);
  const slotStart = new Date(desiredTime);
  const slotEnd = new Date(desiredTime);
  slotEnd.setMinutes(slotEnd.getMinutes() + 30);

  const DoctorId = appointmentItems[0].doctor;
  const isDoctorSame = await Appointment.find({
    'appointmentItems.doctor': DoctorId,
  });

  if (isDoctorSame.length > 0) {
    const isSlotTaken = await Appointment.findOne({ time: { $gte: slotStart, $lt: slotEnd }});

    if (isSlotTaken) {
      throw new ApiError(404, 'Time Slot Is Already Booked');
    } 
  } 
    
    const appointment = new Appointment({
      appointmentItems,
      time: desiredTime,
      user: req.user._id,
      location,
    });

    const createdAppointment = await appointment.save();
    res.json(new ApiResponse(201, createdAppointment, 'Appointment created successfully'));
});

const getMyAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ user: req.user._id });
  res.json(new ApiResponse(200, appointments, 'Appointments fetched successfully'));
});

const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if(!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }
  res.status(200).json(new ApiResponse(200, appointment, 'Appointment fetched successfully'));
 
});

const updateAppointmentToApproved = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if(!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (appointment.isApproved) {
    throw new ApiError(400, 'Appointment is already approved');
  }

  appointment.isApproved = true;
  appointment.ApprovedAt = Date.now();

  const updatedAppointment = await appointment.save();

  res.json(new ApiResponse(200, updatedAppointment, 'Appointment approved successfully'));
  
});

const getAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({})
  .sort({ createdAt: -1 })
  .populate('user', 'id name');
  
  res.json(new ApiResponse(200, appointments, 'Appointments fetched successfully'));
});

export {
  addAppointmentItems,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentToApproved,
  getAppointments,
};
