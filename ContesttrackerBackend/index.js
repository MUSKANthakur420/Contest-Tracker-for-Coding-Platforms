import "dotenv/config";
import connect_db from "./db/index.js";
import { app } from "./app.js";

// Add environment validation
// Note: JWT_SECRET is NOT used by this app - it uses ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET
const requiredEnvVars = [
  'PORT',
  'MONGODB_URL',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingVars.join(', ')}`
  );
  process.exit(1);
}

connect_db({ path: './.env' })
  .then(() => {
    app.on("error", (error) => {
      console.log("Error : ", error);
      throw error;
    });

    const PORT = process.env.PORT || 8000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`SERVER IS RUNNING AT PORT ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Mongo DB connection failed", err);
    process.exit(1);
  });