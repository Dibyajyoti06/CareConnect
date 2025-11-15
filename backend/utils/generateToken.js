import jwt from "jsonwebtoken";

// Helper to generate ANY kind of token
const signToken = ({
  payload = {},
  secret = process.env.JWT_SECRET,
  expiresIn = "1d",
} = {}) => {
  if (!secret) throw new Error("JWT secret key is missing");
  return jwt.sign(payload, secret, { expiresIn });
};

// Helper to set cookies safely
const setCookie = (res, name, token, options = {}) => {
  const defaultOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  };

  res.cookie(name, token, { ...defaultOptions, ...options });
};

// Main token generator
 const generateToken = ({
  res,
  payload = {},
  secret = process.env.JWT_SECRET,
  expiresIn = "1d",
  cookie = false,
  cookieName = "jwt",
  cookieOptions = {},
} = {}) => {
  const token = signToken({ payload, secret, expiresIn });

  if (cookie) {
    if(!res) {
      throw new Error("Response object is required to set cookie");
    }
    setCookie(res, cookieName, token, cookieOptions);
    return;
  }

  return token;
};

export default generateToken;