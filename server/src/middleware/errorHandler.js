export function notFoundHandler(_req, res) {
  res.status(404).json({ message: "Route not found." });
}

export function errorHandler(error, _req, res, _next) {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body contains invalid JSON." });
  }
  if (error.status === 400) {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: "A candidate with this email already exists." });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    const details =
      error.name === "ValidationError"
        ? Object.values(error.errors).map((item) => item.message)
        : ["One or more fields have an invalid value."];
    return res.status(400).json({ message: details[0], errors: details });
  }

  console.error(error);
  res.status(500).json({ message: "An unexpected server error occurred." });
}
