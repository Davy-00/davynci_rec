import path from "node:path";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import dotenv from "dotenv";

import jobsRouter from "./routes/jobs";
import applicantsRouter from "./routes/applicants";
import screeningRouter from "./routes/screening";
import feedbackRouter from "./routes/feedback";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import { requireAuth } from "./middleware/auth";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";

function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Davinci AI Screener API is live",
    database: isDatabaseConnected() ? "connected" : "disconnected",
  });
});

app.use("/api", (req, res, next) => {
  if (req.path === "/health") {
    next();
    return;
  }

  if (!isDatabaseConnected()) {
    res.status(503).json({
      success: false,
      error:
        "Database unavailable. Add your current IP address in MongoDB Atlas Network Access and retry.",
    });
    return;
  }

  next();
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/applicants", applicantsRouter);
app.use("/api/screening", requireAuth, screeningRouter);
app.use("/api/feedback", requireAuth, feedbackRouter);
app.use("/api/admin", requireAuth, adminRouter);

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
);

async function bootstrap() {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });

  if (!MONGO_URI) {
    console.error("MONGO_URI is not set. API will run in degraded mode.");
    return;
  }

  async function connectToDatabase() {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection failed. Retrying in 10 seconds.");
      console.error(error);
      setTimeout(connectToDatabase, 10000);
    }
  }

  void connectToDatabase();
}

bootstrap().catch(console.error);

export default app;
