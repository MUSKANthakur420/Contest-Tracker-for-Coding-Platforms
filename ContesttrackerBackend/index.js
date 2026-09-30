import "dotenv/config";
import connect_db from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`SERVER IS RUNNING AT PORT ${PORT}`);
});

server.on("error", (error) => {
  console.error("Server startup error:", error);
});

connect_db()
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err?.message || err);
  });