const express = require("express");
const {
  listFollowUps,
  getFollowUp,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  completeFollowUp,
} = require("../controllers/followUpsController");

const router = express.Router();

router.get("/", listFollowUps);
router.get("/:id", getFollowUp);
router.post("/", createFollowUp);
router.put("/:id", updateFollowUp);
router.delete("/:id", deleteFollowUp);
router.patch("/:id/complete", completeFollowUp);

module.exports = router;
