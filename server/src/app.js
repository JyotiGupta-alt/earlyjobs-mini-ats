import cors from "cors";
import express from "express";
import candidateRoutes from "./routes/candidateRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("This origin is not allowed by CORS."));
    },
  })
);
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/candidates", candidateRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
