function badRequest(res, errors) {
  return res.status(400).json({
    message: "Validation failed",
    errors: Array.isArray(errors) ? errors : [errors],
  });
}

function notFound(res, entity = "Resource") {
  return res.status(404).json({ message: `${entity} not found` });
}

module.exports = { badRequest, notFound };
