import mongoose from "mongoose";

const id = { type: mongoose.Schema.Types.ObjectId, ref: "User" };

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    bio: { type: String, default: "", maxlength: 500 },
    photo: { type: String, default: "", maxlength: 1800000 },
    library: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
    progress: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
        chapter: Number,
        scroll: Number,
      },
    ],
  },
  { timestamps: true },
);

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    genre: {
      type: String,
      required: true,
      enum: [
        "Sci-Fi",
        "Romance",
        "Dark Romance",
        "Mystery",
        "Thriller",
        "Fantasy",
        "Other",
      ],
    },
    cover: { type: String, default: "", maxlength: 1800000 },
    author: { ...id, required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    chapters: [
      {
        status: {
          type: String,
          enum: ["draft", "published"],
          default: "published",
        },
        title: { type: String, required: true, maxlength: 150 },
        content: { type: String, required: true, maxlength: 100000 },
      },
    ],
    votes: [id],
  },
  { timestamps: true },
);

const commentSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, required: true },
    author: { ...id, required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Book = mongoose.models.Book || mongoose.model("Book", bookSchema);
export const Comment =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);
