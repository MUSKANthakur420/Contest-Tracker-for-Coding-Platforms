import mongoose from "mongoose"
import {DB_NAME} from "../constant.js"
const connnect_db=async(req,res)=>{
    try{
   const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`MONGO DB CONNECTED SUCCESSFULLY:${connectionInstance.connection.host} `)
}
    catch(error){
    console.log(error);
    }
}
export default connnect_db;