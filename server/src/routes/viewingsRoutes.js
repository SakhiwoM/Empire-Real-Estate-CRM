const express = require("express");
const {
  listViewings,
  getViewing,
  createViewing,
  updateViewing,
  deleteViewing,
} = require("../controllers/viewingsController");

const router = express.Router();

router.get("/", listViewings);
router.get("/:id", getViewing);
router.post("/", createViewing);
router.put("/:id", updateViewing);
router.delete("/:id", deleteViewing);

module.exports = router;
