import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import bookRoutes from "./routes/books.js";
import commentRoutes from "./routes/comments.js";
import userRoutes from "./routes/users.js";
import errorHandler from "./middleware/errorHandler.js";

export default function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
  app.use(express.json({ limit: "5mb" }));
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use("/api/auth", authRoutes);
  app.use("/api/books", bookRoutes);
  app.use("/api", userRoutes);
  app.use("/api", commentRoutes);
  app.use(errorHandler);
  return app;
}
