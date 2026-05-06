const express = require("express");
const {
  backupDatabase,
  downloadLatestBackup,
  exportContacts,
  exportProperties,
  exportFollowUps,
} = require("../controllers/systemController");

const router = express.Router();

router.post("/backup", backupDatabase);
router.get("/backup/latest", downloadLatestBackup);
router.get("/export/contacts", exportContacts);
router.get("/export/properties", exportProperties);
router.get("/export/follow-ups", exportFollowUps);

module.exports = router;
