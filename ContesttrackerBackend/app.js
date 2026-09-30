import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";

const app = express();
app.disable("x-powered-by");

// Request ID middleware for tracing
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection (legacy but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Prevent IE from opening untrusted HTML
  res.setHeader('X-Download-Options', 'noopen');

  // Prevent IE from executing downloads in context
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // HSTS would be good if we serve HTTPS directly, but Render handles TLS
  // Only enable if we're sure we serve HTTPS directly
  // if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
  //   res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // }

  next();
});

app.use(express.json({ limit: '10kb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Limit URL-encoded payload

app.use(cookieParser());

// CORS (Cross-Origin Resource Sharing) allow karta hai ki dusri origin (frontend) tumhare backend ko request bhej sake.

// Example:

// Frontend: http://localhost:5173 (React + Vite)
// Backend: http://localhost:8000

// Ye dono different origins hain, isliye browser by default request block kar deta hai.
// credentials: true

// Ye browser ko allow karta hai ki request ke saath:

// Cookies
// Authorization headers
// Session IDs

// bhej sake.

// JWT agar HTTP-only cookie me store karoge to ye mandatory hai.
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://contest-tracker-platform.vercel.app",
    "https://contesttrackerfrontend-khaki.vercel.app",
    "https://contesttrackerfrontend-455s3qs7p.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      return callback(null, true); // FIXED: Return boolean, not origin
    }
    // REJECT unknown origins
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
}));

app.use(express.static("public")); //means exposes the public folder to the outside world so that it can be accessed by the frontend/browser

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is awake", timestamp: new Date().toISOString() });
});

import router from "./route/user.route.js";

app.use("/api/v1/users", router); //format for sending request

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Global Error Handler caught:", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Profile image is too large. Maximum allowed file size is 5 MB.",
      error: "LIMIT_FILE_SIZE"
    });
  }
  const statusCode = err.statuscode || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    message,
    error: err.error || null
  });
});

export { app };