import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { createToken, publicUser } from "../utils.js";

const router = Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    let { username, email, password } = req.body;
    username = String(username || "").trim();
    email = String(email || "")
      .trim()
      .toLowerCase();
    if (
      !/^[a-zA-Z0-9_]{3,30}$/.test(username) ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    )
      return res.status(400).json({
        message:
          "Use a 3–30 character username (letters, numbers, underscores), a valid email and a password of 8–72 characters.",
      });
    const user = await User.create({
      username,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      username: String(req.body.username || "").trim(),
    }).select("+passwordHash");
    if (
      !user ||
      !(await bcrypt.compare(String(req.body.password || ""), user.passwordHash))
    )
      return res.status(401).json({ message: "Incorrect username or password." });
    res.json({ token: createToken(user), user: publicUser(user) });
  }),
);

export default router;
