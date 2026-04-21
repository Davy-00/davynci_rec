import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/User";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-prod";
const JWT_EXPIRES_IN = "8h";
const BCRYPT_ROUNDS = 12;

// POST /api/auth/signup
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ success: false, error: "Username and password are required." });
    return;
  }

  const trimmed = username.trim().toLowerCase();

  if (trimmed.length < 3 || trimmed.length > 32) {
    res.status(400).json({ success: false, error: "Username must be 3–32 characters." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ success: false, error: "Password must be at least 8 characters." });
    return;
  }

  const existing = await UserModel.findOne({ username: trimmed });
  if (existing) {
    res.status(409).json({ success: false, error: "Username already taken." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await UserModel.create({ username: trimmed, passwordHash, role: "hr" });

  const token = jwt.sign({ role: user.role, sub: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.status(201).json({ success: true, token, expiresIn: JWT_EXPIRES_IN });
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(401).json({ success: false, error: "Invalid credentials." });
    return;
  }

  const trimmed = username.trim().toLowerCase();

  // Check DB users first
  const user = await UserModel.findOne({ username: trimmed });
  if (user) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: "Invalid credentials." });
      return;
    }
    const token = jwt.sign({ role: user.role, sub: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ success: true, token, expiresIn: JWT_EXPIRES_IN });
    return;
  }

  // Fallback: legacy env-var admin account
  const envUser = process.env.HR_USERNAME || "admin";
  const envPass = process.env.HR_PASSWORD || "admin123";
  if (trimmed === envUser && password === envPass) {
    // Use a stable synthetic sub so req.userId is always set for this admin
    const token = jwt.sign({ role: "hr", sub: "env-admin" }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ success: true, token, expiresIn: JWT_EXPIRES_IN });
    return;
  }

  res.status(401).json({ success: false, error: "Invalid credentials." });
});

// GET /api/auth/me — validates a token and returns the role
router.get("/me", (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "No token." });
    return;
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { role: string };
    res.json({ success: true, role: payload.role });
  } catch {
    res.status(401).json({ success: false, error: "Token invalid or expired." });
  }
});

export default router;
