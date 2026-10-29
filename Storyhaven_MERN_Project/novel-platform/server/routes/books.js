import { Router } from "express";
import { Book, Comment, User } from "../models.js";
import requireAuth from "../middleware/auth.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { bookData, isValidBook, publicBook, uid } from "../utils.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = String(req.query.search || "")
        .trim()
        .slice(0, 100),
      genre = String(req.query.genre || "");
    const authors = search
      ? await User.find({
          username: {
            $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }).select("_id")
      : [];
    const filter = { status: "published" };
    if (search)
      filter.$or = [
        {
          title: {
            $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        },
        { author: { $in: authors.map((author) => author._id) } },
      ];
    if (genre) filter.genre = genre;
    const sort =
      req.query.sort === "oldest"
        ? { createdAt: 1 }
        : req.query.sort === "title"
          ? { title: 1 }
          : { createdAt: -1 };
    const books = await Book.find(filter)
      .populate("author", "username photo")
      .sort(sort)
      .limit(100);
    res.json(books.map(publicBook));
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id).populate(
      "author",
      "username photo",
    );
    if (!book || book.status !== "published")
      return res.status(404).json({ message: "Book not found" });
    res.json(publicBook(book));
  }),
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isValidBook(req.body))
      return res.status(400).json({
        message:
          "Check the book details. Published books need at least one complete chapter.",
      });
    res
      .status(201)
      .json(await Book.create({ ...bookData(req.body), author: req.user._id }));
  }),
);

router.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book || uid(book.author) !== req.user.id)
      return res.status(404).json({ message: "Book not found" });
    if (!isValidBook(req.body))
      return res.status(400).json({
        message:
          "Check the book details. Published books need at least one complete chapter.",
      });
    const oldChapterIds = book.chapters.map((chapter) => String(chapter._id));
    Object.assign(book, bookData(req.body));
    await book.save();
    const currentChapterIds = book.chapters.map((chapter) =>
      String(chapter._id),
    );
    await Comment.deleteMany({
      book: book._id,
      chapter: {
        $in: oldChapterIds.filter((id) => !currentChapterIds.includes(id)),
      },
    });
    res.json(book);
  }),
);

router.patch(
  "/:id/unpublish",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await Book.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user._id,
        status: "published",
      },
      { $set: { status: "draft" } },
      { new: true },
    );
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  }),
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
    });
    if (!book) return res.status(404).json({ message: "Book not found" });
    await Comment.deleteMany({ book: book._id });
    await User.updateMany(
      {},
      { $pull: { library: book._id, progress: { book: book._id } } },
    );
    res.json({ message: "Book deleted" });
  }),
);

export default router;
