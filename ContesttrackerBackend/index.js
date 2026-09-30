import "dotenv/config";
import connect_db from "./db/index.js";
import { app } from "./app.js";

// Add environment validation
// Note: JWT_SECRET is NOT used by this app - it uses ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET
const requiredEnvVars = ['PORT', 'MONGODB_URL', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];
const missingVars = requiredEnvVars.filter(var => !process.env[var]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

connect_db({path:'./.env'})
.then(()=>{
    app.on("error", (error) => {
        console.log("Error : ", error);
        throw error;
     });
app.listen(process.env.PORT || 8000,()=>{
    console.log(`SERVER IS RUNNING AT PORT ${process.env.PORT}`);
});
})
.catch((err)=>{
    console.log("Mongo DB connection failed",err);
    process.exit(1);
})