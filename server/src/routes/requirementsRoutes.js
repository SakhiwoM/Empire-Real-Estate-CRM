const express = require("express");
const {
  listRequirements,
  getRequirement,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  getRequirementMatches,
} = require("../controllers/requirementsController");

const router = express.Router();

router.get("/", listRequirements);
router.get("/:id", getRequirement);
router.post("/", createRequirement);
router.put("/:id", updateRequirement);
router.delete("/:id", deleteRequirement);
router.get("/:id/matches", getRequirementMatches);

module.exports = router;
