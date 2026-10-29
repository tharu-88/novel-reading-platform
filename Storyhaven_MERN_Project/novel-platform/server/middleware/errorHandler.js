export default function errorHandler(err, req, res, next) {
  console.error(err.message);
  if (err.code === 11000)
    return res
      .status(409)
      .json({ message: "Username or email already exists." });
  if (
    err.name === "CastError" ||
    err.name === "ValidationError" ||
    err.type === "entity.too.large"
  )
    return res
      .status(400)
      .json({ message: "Invalid input or image too large." });
  res.status(500).json({ message: "Something went wrong. Please try again." });
}
