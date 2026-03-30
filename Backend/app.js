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

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use("/api/auth", authRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/user", userRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/me", meRoutes);
app.use("/api/consent", consentRoutes);

module.exports = app; // <-- exporte l'app Express
