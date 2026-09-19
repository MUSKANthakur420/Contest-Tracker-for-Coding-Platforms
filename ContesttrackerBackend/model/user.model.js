import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Apierr from "../utils/Apierr.js";
import jwt from "jsonwebtoken";
const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
    },
    phone:{
        type:String,
        required:true,
    },
    otp:{
        type:String
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    image:{
        type:String,
    },
    refreshToken:{
        type:String,
    },
    codingProfiles:{
        leetcode:{
            type:String,
        },
        codeforces:{
            type:String,
        },
        codechef:{
            type:String,
        },
        atcoder:{
            type:String,
        },
        gfg:{
            type:String,
        },
        hackerrank: { type: String, default: "" },
        naukri: { type: String, default: "" }
    }
});
userSchema.pre("save",async function(){
    if(!this.isModified("password")){
        return ;
    }
    this.password=await bcrypt.hash(this.password,10);
});
userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password);
}
userSchema.methods.generateAccessToken=function(){
    if(!process.env.ACCESS_TOKEN_SECRET)
        throw new Apierr(400,"invalid request ");
    return jwt.sign({
        _id:this._id,
        username:this.username,
        email:this.email,
        codingProfiles:this.codingProfiles
    },
    process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:"1d"
    }
)
}
userSchema.methods.generateRefreshToken=function(){
    if(!process.env.REFRESH_TOKEN_SECRET)
        throw new Apierr(400,"invalid request ");
   return jwt.sign({
        _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:"10d"
    }
)
}
const User=new mongoose.model("User",userSchema);
export default User;
