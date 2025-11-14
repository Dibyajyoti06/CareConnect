import { ApiError } from "../utils/apiError.js";

const notFound = (req) => {
  throw new ApiError(404, `Not Found - ${req.originalUrl}`);
  
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  res.status(statusCode).json({
    success: false,
    statusCode: statusCode,
    message: message,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { notFound, errorHandler };
