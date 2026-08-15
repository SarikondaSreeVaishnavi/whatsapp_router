export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error("[error]", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Validation failed", details: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "That username or email is already taken" });
  }

  const status = err.status || 500;
  const message =
    status === 500 ? "Something went wrong on our end" : err.message || "Request failed";
  res.status(status).json({ error: message });
}
