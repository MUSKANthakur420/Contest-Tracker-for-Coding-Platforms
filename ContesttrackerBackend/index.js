import "dotenv/config";
import connect_db from "./db/index.js";
import { app } from "./app.js";
connect_db({path:'./.env'})
.then(()=>{
    app.on("errror",()=>{
        console.log("Error : ",error);
        throw error;
     });
app.listen(process.env.PORT || 8000,()=>{
    console.log(`SERVER IS RUNNING AT PORT ${process.env.PORT}`)
});
})
.catch((err)=>{
    console.log("Mongo DB connection failed",err);
})