import { Router } from "express";
import { Book, Comment } from "../models.js";
import requireAuth from "../middleware/auth.js";
import asyncHandler from "../middleware/asyncHandler.js";

const router = Router();

router.get(
  "/books/:id/comments/:chapter",
  asyncHandler(async (req, res) => {
    const book = await Book.findOne({
      _id: req.params.id,
      status: "published",
    });
    const chapter = book?.chapters.id(req.params.chapter);
    if (!chapter || chapter.status === "draft")
      return res.status(404).json({ message: "Chapter not found" });
    res.json(
      await Comment.find({ book: book._id, chapter: req.params.chapter })
        .populate("author", "username photo")
        .sort({ createdAt: -1 }),
    );
  }),
);

router.post(
  "/books/:id/comments/:chapter",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await Book.findOne({
      _id: req.params.id,
      status: "published",
    });
    const chapter = book?.chapters.id(req.params.chapter);
    if (!chapter || chapter.status === "draft")
      return res.status(404).json({ message: "Chapter not found" });
    const text = String(req.body.text || "").trim();
    if (!text || text.length > 1000)
      return res
        .status(400)
        .json({ message: "Comment must be 1–1000 characters" });
    const comment = await Comment.create({
      book: book._id,
      chapter: req.params.chapter,
      author: req.user._id,
      text,
    });
    res.status(201).json(await comment.populate("author", "username photo"));
  }),
);

router.put(
  "/comments/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const comment = await Comment.findOne({
      _id: req.params.id,
      author: req.user._id,
    });
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    comment.text = String(req.body.text || "").trim();
    if (!comment.text || comment.text.length > 1000)
      return res
        .status(400)
        .json({ message: "Comment must be 1–1000 characters" });
    await comment.save();
    res.json(await comment.populate("author", "username photo"));
  }),
);

router.delete(
  "/comments/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
    });
    if (!comment)
      return res.status(404).json({ message: "Comment not found" });
    res.json({ message: "Comment deleted" });
  }),
);

export default router;
