import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const uid = (user) => String(user?._id || user);

export const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  bio: user.bio,
  photo: user.photo,
  library: user.library,
  progress: user.progress,
});

export const createToken = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const isImage = (value) =>
  !value || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);

export const publicBook = (book) => {
  const result = book.toObject();
  result.chapters = result.chapters.filter(
    (chapter) => chapter.status !== "draft",
  );
  return result;
};

export function isValidBook(body) {
  return (
    typeof body.title === "string" &&
    body.title.trim().length > 0 &&
    body.title.length <= 150 &&
    typeof body.description === "string" &&
    body.description.trim().length > 0 &&
    body.description.length <= 3000 &&
    [
      "Sci-Fi",
      "Romance",
      "Dark Romance",
      "Mystery",
      "Thriller",
      "Fantasy",
      "Other",
    ].includes(body.genre) &&
    ["draft", "published"].includes(body.status) &&
    Array.isArray(body.chapters) &&
    body.chapters.length <= 100 &&
    body.chapters.every(
      (chapter) =>
        (!chapter.status || ["draft", "published"].includes(chapter.status)) &&
        typeof chapter.title === "string" &&
        chapter.title.trim() &&
        chapter.title.length <= 150 &&
        typeof chapter.content === "string" &&
        chapter.content.trim() &&
        chapter.content.length <= 100000,
    ) &&
    (!body.cover ||
      (typeof body.cover === "string" &&
        body.cover.length <= 1800000 &&
        isImage(body.cover))) &&
    (body.status !== "published" ||
      body.chapters.some(
        (chapter) => (chapter.status || "published") === "published",
      ))
  );
}

export function bookData(body) {
  return {
    title: body.title,
    description: body.description,
    genre: body.genre,
    status: body.status,
    cover: body.cover || "",
    chapters: body.chapters.map((chapter) => ({
      _id: chapter._id || new mongoose.Types.ObjectId(),
      status: chapter.status || "published",
      title: chapter.title,
      content: chapter.content,
    })),
  };
}
