import { Router } from "express";
import bcrypt from "bcryptjs";
import { Book, User } from "../models.js";
import requireAuth from "../middleware/auth.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { isImage, publicBook, publicUser, uid } from "../utils.js";

const router = Router();

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => res.json(publicUser(req.user))),
);

router.put(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { bio = "", photo = "" } = req.body;
    if (
      typeof bio !== "string" ||
      bio.length > 500 ||
      typeof photo !== "string" ||
      !isImage(photo) ||
      photo.length > 1800000
    )
      return res
        .status(400)
        .json({ message: "Invalid profile details or image." });
    req.user.bio = bio;
    req.user.photo = photo;
    await req.user.save();
    res.json(publicUser(req.user));
  }),
);

router.put(
  "/me/password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      newPassword.length < 8 ||
      newPassword.length > 72
    )
      return res.status(400).json({
        message: "Enter your current password and a new password of 8–72 characters.",
      });

    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash)))
      return res.status(400).json({ message: "Current password is incorrect." });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: "Password updated." });
  }),
);

router.get(
  "/my/books",
  requireAuth,
  asyncHandler(async (req, res) =>
    res.json(
      await Book.find({ author: req.user._id })
        .populate("author", "username photo")
        .sort({ updatedAt: -1 }),
    ),
  ),
);

router.get(
  "/my/library",
  requireAuth,
  asyncHandler(async (req, res) => {
    const books = await Book.find({
        _id: { $in: req.user.library },
        status: "published",
      }).populate("author", "username photo");
    res.json(books.map(publicBook));
  }),
);

router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select(
      "username bio photo library",
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    const books = await Book.find({
      author: user._id,
      status: "published",
    }).populate("author", "username photo");
    const library = await Book.find({
      _id: { $in: user.library },
      status: "published",
    }).populate("author", "username photo");
    res.json({
      user: {
        id: user.id,
        username: user.username,
        bio: user.bio,
        photo: user.photo,
      },
      books: books.map(publicBook),
      library: library.map(publicBook),
    });
  }),
);

router.post(
  "/library/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await Book.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (!req.user.library.some((item) => uid(item) === book.id))
      req.user.library.push(book._id);
    await req.user.save();
    res.json(publicUser(req.user));
  }),
);

router.delete(
  "/library/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    req.user.library.pull(req.params.id);
    await req.user.save();
    res.json(publicUser(req.user));
  }),
);

router.put(
  "/progress/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await Book.findOne({
      _id: req.params.id,
      status: "published",
    });
    const visibleChapters =
      book?.chapters.filter((item) => item.status !== "draft") || [];
    const chapter = Number(req.body.chapter);
    const scroll = Number(req.body.scroll);
    if (
      !book ||
      !Number.isInteger(chapter) ||
      chapter < 0 ||
      chapter >= visibleChapters.length ||
      !Number.isFinite(scroll) ||
      scroll < 0 ||
      scroll > 1
    )
      return res.status(400).json({ message: "Invalid reading position" });
    const progress = req.user.progress.find(
      (item) => uid(item.book) === book.id,
    );
    if (progress) {
      progress.chapter = chapter;
      progress.scroll = scroll;
    } else req.user.progress.push({ book: book._id, chapter, scroll });
    await req.user.save();
    res.json({ ok: true });
  }),
);

router.post(
  "/books/:id/vote",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await Book.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (book.votes.some((item) => uid(item) === req.user.id))
      book.votes.pull(req.user._id);
    else book.votes.push(req.user._id);
    await book.save();
    res.json({ votes: book.votes });
  }),
);

export default router;
