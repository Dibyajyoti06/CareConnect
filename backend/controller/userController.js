import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import SendEmailUtility from '../utils/sendEmailUtility.js';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some(field => !field || field.trim() === "")) {
  throw new ApiError(400,'Email and password are required');
  }

  const user = await User.findOne({ email });
  
  if(!user || !(await user.matchPassword(password))){
    throw new ApiError(401,'Invalid email or password');
  }

  if(!user.isVerified){
    throw new ApiError(401,'Please activate your account');
  }

      generateToken({res, payload: { id: user._id }, cookie: true, cookieName: 'jwt'});
      res.json(new ApiResponse(200,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      },
      'Authentication successful'));

});

const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email });

  if (!user) {
    throw new ApiError(401,'User Not Found!');
  }

  const token = generateToken({
    payload: { id: user._id },
    secret:process.env.JWT_SECRET,
    expiresIn: '1d',
  });

  let EmailSubject = 'Reset Password Link';
  let EmailText = `<p> Hi ${user.name} </p>
  <br> Please <a href="http://localhost:5000/api/users/resetpassword/${user._id}/${token}">Click Here</a> To  Reset Your Password </br>`;
  let EmailTo = email;

  const success=await SendEmailUtility(EmailTo, EmailText, EmailSubject);
  if(success){
    res.json(new ApiResponse(200,null,'Password reset email sent successfully'));
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  if(!password || password.trim() === ''){
    throw new ApiError(400,'Password is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(400, 'Reset token has expired. Please request a new one.');
    } else {
      throw new ApiError(400, 'Invalid reset token');
    }
  }

  if (decoded.id !== id) {
    throw new ApiError(400, 'Invalid reset token');
  }

  const user= await User.findById(id);
  if(!user){
    throw new ApiError(404,'User not found');
  } 
  user.password = password;
  await user.save();
  res.json(new ApiResponse(200,null,'Password has been reset successfully'));
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if ([name, email, password].some((field) => field?.trim() === "")){
    throw new ApiError(400,'All fields are required');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new ApiError(400,'User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const token = generateToken({
    payload: { id: user._id },
    secret: process.env.EMAIL_VERIFY_SECRET,
    expiresIn: '1d',
  });

  let EmailSubject = 'Active Account Link';
  const link = `http://localhost:5000/api/users/active/${token}`;
  let EmailText = `<p> Hi ${user.name} </p>
  <br> Please <a href="${link}">Click Here</a> To  Active Your Account </br>`;
  let EmailTo = email;

   const success = await SendEmailUtility(EmailTo, EmailText, EmailSubject);
   if(success){
    return res.json(new ApiResponse(201,user,'User registered successfully. Please check your email to activate your account.'));
   }
});

const activeUser = asyncHandler(async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET);
    const userId = decoded.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (user.isVerified) {
      return res.json(new ApiResponse(200,user,'Account is already activated'));
    }
      user.isVerified = true;
      await user.save();
    res.json(new ApiResponse(200,user,'Account activated successfully'));
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(400, "Verification token has expired. Please request a new one.");
    } else if (error.name === "JsonWebTokenError") {
      throw new ApiError(400, "Invalid verification token");
    } else {
      // Fallback for other errors (DB errors, unexpected errors)
      throw new ApiError(500, "Failed to verify user");
    }
  }
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "User is already verified");
  }

  const token = generateToken({
    payload: { id: user._id },
    secret: process.env.EMAIL_VERIFY_SECRET,
    expiresIn: '1d',
  });

  const link = `http://localhost:5000/api/users/active/${token}`;
  const emailText = `<p>Hi ${user.name},</p><br>Please <a href="${link}">Click Here</a> to verify your account.</br>`;
  const emailSubject = "Verify Your Account";

  // Send email
  const success = await SendEmailUtility(user.email, emailText, emailSubject);
  if(success){
    res.json(new ApiResponse(200, null, "Verification email resent"));
  }

});

const logoutUser = (req, res) => {
  generateToken({res, cookieName:'jwt', cookie:true, cookieOptions: { expires: new Date(0) }});
  res.json(new ApiResponse(200,null,'Logged out successfully'));
};

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('_id name email isAdmin');

  if(!user){
    throw new ApiError(404,'User not found');
  }
  res.json(new ApiResponse(200,user,'User profile fetched successfully'));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if(!user){
    throw new ApiError(404,'User not found');
  }
  if (req.body.name?.trim()) user.name = req.body.name.trim();
  if (req.body.email?.trim()) user.email = req.body.email.trim();
  if (req.body.password?.trim()) user.password = req.body.password;

  const updatedUser = await user.save();

  res.json(new ApiResponse(200,
    {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    },
    'User profile updated successfully'));  
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json(new ApiResponse(200, users, 'Users fetched successfully'));
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if(!user){
    throw new ApiError(404,'User not found');
  }

    if (user.isAdmin) {
      res.status(400);
      throw new ApiError(400, 'Can not delete admin user');
    }
    await User.findByIdAndDelete(user._id);
    res.json(new ApiResponse(200, null, 'User removed'));
  
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if(!user){
    throw new ApiError(404,'User not found');
  }
  res.json(new ApiResponse(200, user, 'User fetched successfully'));
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if(!user){
    throw new ApiError(404,'User not found');
  }

  if (req.body.name?.trim()) user.name = req.body.name.trim();
  if (req.body.email?.trim()) user.email = req.body.email.trim();
  if (req.body.isAdmin !== undefined) user.isAdmin = Boolean(req.body.isAdmin);


  const updatedUser = await user.save();

  res.json(new ApiResponse(200,
    {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    },
    'User updated successfully'));

});

export {
  authUser,
  forgetPassword,
  resetPassword,
  registerUser,
  logoutUser,
  activeUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  resendVerificationEmail
};
