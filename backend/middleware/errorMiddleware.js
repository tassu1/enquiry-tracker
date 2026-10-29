function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.name === "ValidationError" || err.name === "CastError")
    return res.status(400).json({ success: false, message: err.message });
  if (err.code === 11000)
    return res.status(409).json({ success: false, message: "An employee with this email is already registered" });
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
}
module.exports = { notFound, errorHandler };
