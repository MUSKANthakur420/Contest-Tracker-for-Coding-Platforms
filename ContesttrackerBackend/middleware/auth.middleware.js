import asynchandler from "../utils/asynchandler.js";
import  apierror  from "../utils/Apierr.js";
import  User  from "../model/user.model.js";
import jwt from "jsonwebtoken";
// Ye middleware tumhare protected routes ko secure karta hai. Iska kaam hai request se JWT 
// access token lena, verify karna, aur agar token valid ho to user ko req.user me attach karke controller ko bhejna.
export const VerifyJWT= asynchandler(async(req,res,next)=>{
try {
    const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
        if(!token)
            return res.status(400).json(new apierror(401,"unauthorized request"))
       const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
      const user = await User.findById(decodedToken?._id).select("-password -refreshtoken")
      if(!user){
        return res.status(400).json(new apierror(401,"Invalid acces token request"))
      }
      req.user=user;
      next()
} catch (error) {
    return res.status(400).json(new apierror(401,error?.message || "Invalid Access Token"))
}
})