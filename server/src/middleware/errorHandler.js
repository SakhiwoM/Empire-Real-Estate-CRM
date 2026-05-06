function notFoundHandler(req, res) {
  res.status(404).json({ message: "Route not found" });
}

function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.code === "LIMIT_FILE_SIZE") {
    status = 400;
    message = "Image too large. Maximum file size is 8MB.";
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    status = 400;
    message = "Too many images. Upload up to 10 images at once.";
  }

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ message });
}

module.exports = { notFoundHandler, errorHandler };
