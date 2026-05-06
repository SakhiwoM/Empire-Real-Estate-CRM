const express = require("express");
const {
  getAuthStatus,
  setupOwner,
  login,
  logout,
  me,
} = require("../controllers/authController");
const { attachAuthUser, requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/status", attachAuthUser, getAuthStatus);
router.post("/setup", setupOwner);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

module.exports = router;
