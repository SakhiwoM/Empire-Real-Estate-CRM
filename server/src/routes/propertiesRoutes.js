const express = require("express");
const {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyMatches,
  listPropertyImages,
  uploadPropertyImages,
  deletePropertyImage,
} = require("../controllers/propertiesController");
const { uploadPropertyImages: uploadMiddleware } = require("../middleware/upload");

const router = express.Router();

router.get("/", listProperties);
router.get("/:id/images", listPropertyImages);
router.post("/:id/images", uploadMiddleware.array("images", 10), uploadPropertyImages);
router.delete("/:id/images/:imageId", deletePropertyImage);
router.get("/:id", getProperty);
router.post("/", createProperty);
router.put("/:id", updateProperty);
router.delete("/:id", deleteProperty);
router.get("/:id/matches", getPropertyMatches);

module.exports = router;
