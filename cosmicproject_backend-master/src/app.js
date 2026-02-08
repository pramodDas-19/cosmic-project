const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const logger = require("./utils/logger");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const notificationRoutes = require("./routes/notifications");
const superAdminRoutes = require("./routes/superAdmin");
const managerRoutes = require("./routes/manager");
const technicianRoutes = require("./routes/technician");
const reportsRoutes = require("./routes/reports");
const seedRoutes = require("./routes/seed");
const profileRoutes = require("./routes/profile");
const projectsRoutes = require("./routes/projects");
const filesRoutes = require("./routes/files");
const tasksRoutes = require("./routes/tasks");
// OTP routes disabled — OTPs are generated only at manager task assignment
// const otpRoutes = require("./controllers/otpRoutes");

const app = express();

/* =========================
   BASIC CONFIG
========================= */
app.set("trust proxy", true);

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'https://cosmic-project.onrender.com',
        'https://cosmic-project.onrender.com',
        'https://your-admin-domain.com' // Add your admin domain if needed
      ]
    : true, // Allow all origins in development
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200
};

/* =========================
   MIDDLEWARE
========================= */
app.use(cors(corsOptions));
app.use(helmet());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================
   LOGGER
========================= */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  next();
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server running 🚀",
    time: new Date().toISOString(),
  });
});

/* =========================
   API ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
// app.use("/api/otp", otpRoutes); // OTP routes disabled
app.use("/api/notifications", notificationRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/technician", technicianRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/tasks", tasksRoutes);

/* =========================
   UPLOADS
========================= */
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.json({
    message: "Backend running successfully 🚀",
    environment: process.env.NODE_ENV || "development",
  });
});

// favicon fix
app.get("/favicon.ico", (req, res) => res.sendStatus(204));

/* =========================
   ERROR HANDLERS
========================= */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
