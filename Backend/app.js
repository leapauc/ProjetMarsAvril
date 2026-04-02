require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./swaggerOptions");

const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/events.routes");
const userRoutes = require("./routes/user.routes");
const registrationRoutes = require("./routes/registration.routes");
const meRoutes = require("./routes/api_me.routes");
const consentRoutes = require("./routes/consent.routes");
const historyRoutes = require("./routes/history.routes");
const statsRoutes = require("./routes/stats.routes");

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use("/api/auth", authRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/user", userRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/me", meRoutes);
app.use("/api/consent", consentRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/stats", statsRoutes);

module.exports = app;
