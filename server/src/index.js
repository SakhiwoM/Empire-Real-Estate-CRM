const dotenv = require("dotenv");

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || !jwtSecret.trim()) {
  console.error("[FATAL] Missing JWT_SECRET in server/.env");
  console.error("[FATAL] Add a strong JWT_SECRET value, then start the server again.");
  process.exit(1);
}

const { initDb } = require("./db/initDb");
const { app } = require("./app");

initDb();

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "127.0.0.1";

app.listen(PORT, HOST, () => {
  console.log(`Empire Property CRM server running on http://localhost:${PORT}`);
});
