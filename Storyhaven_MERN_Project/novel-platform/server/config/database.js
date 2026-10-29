import mongoose from "mongoose";

export default async function connectDatabase() {
  if (
    !process.env.MONGO_URI ||
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 24
  )
    throw Error(
      "Set MONGO_URI and a JWT_SECRET of at least 24 characters in server/.env",
    );
  await mongoose.connect(process.env.MONGO_URI);
}
