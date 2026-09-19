import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();


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
app.use(cors({
  origin: [
      "http://localhost:5173",
      "https://contesttrackerfrontend-khaki.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); //parses html form data and puts it in req.body and extended means to allow nested objects
app.use(cookieParser()); //cookie parses into accesstoken and refrsh token and puts it in req.cookies
app.use(express.static("public")); //means exposes the public folder to the outside world so that it can be accessed by the frontend/browser

import router from "./route/user.route.js";

app.use("/api/v1/users", router); //format for sending request

export { app };