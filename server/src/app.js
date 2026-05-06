const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const contactsRoutes = require("./routes/contactsRoutes");
const requirementsRoutes = require("./routes/requirementsRoutes");
const propertiesRoutes = require("./routes/propertiesRoutes");
const followUpsRoutes = require("./routes/followUpsRoutes");
const viewingsRoutes = require("./routes/viewingsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const systemRoutes = require("./routes/systemRoutes");
const { requireAuth } = require("./middleware/auth");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: [clientUrl, "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/uploads", requireAuth, express.static(path.join(__dirname, "../uploads")));

app.use("/api/contacts", requireAuth, contactsRoutes);
app.use("/api/requirements", requireAuth, requirementsRoutes);
app.use("/api/properties", requireAuth, propertiesRoutes);
app.use("/api/follow-ups", requireAuth, followUpsRoutes);
app.use("/api/viewings", requireAuth, viewingsRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/reports", requireAuth, reportsRoutes);
app.use("/api", requireAuth, systemRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
