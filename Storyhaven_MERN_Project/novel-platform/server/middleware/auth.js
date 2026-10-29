import jwt from "jsonwebtoken";
import { User } from "../models.js";
import asyncHandler from "./asyncHandler.js";

const requireAuth = asyncHandler(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id);
    if (!req.user) throw Error();
    next();
  } catch {
    res.status(401).json({ message: "Please sign in to continue." });
  }
});

export default requireAuth;
