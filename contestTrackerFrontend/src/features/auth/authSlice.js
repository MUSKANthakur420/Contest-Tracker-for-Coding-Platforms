import {createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../../utils/axios";
export const registerUser = createAsyncThunk("auth/registerUser", async ({
    username,phone,email, password, leetcode, codeforces, atcoder, gfg,hackerank,naukri, img
}, { rejectWithValue }) => {
    try {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("phone", phone);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("leetcode", leetcode);
        formData.append("codeforces", codeforces);
        formData.append("atcoder", atcoder);
        formData.append("gfg", gfg);
        formData.append("hackerrank", hackerank);
        formData.append("naukri", naukri);
        if (img) formData.append("image", img);

        const user = await axios.post("/api/v1/users/register", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
        });
        return user.data.data;
    }  catch (error) {
        console.log("REGISTER ERROR STATUS:", error.response?.status);
        console.log("REGISTER ERROR DATA:", error.response?.data);
        console.log("REGISTER ERROR MESSAGE:", error.message);
    
        return rejectWithValue(
            error.response?.data?.message || error.message
        );
    }
});
export const updateUser = createAsyncThunk("auth/updateUser", async ({
    username,phone, email, password, leetcode, codeforces, atcoder, gfg,hackerank,naukri, img
}, { rejectWithValue }) => {
    try {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("phone", phone);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("leetcode", leetcode);
        formData.append("codeforces", codeforces);
        formData.append("atcoder", atcoder);
        formData.append("gfg", gfg);
        formData.append("hackerrank", hackerank);
        formData.append("naukri", naukri);
        if (img) formData.append("image", img);

        const user = await axios.post("/api/v1/users/updateAccount", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
        });
        return user.data.data;
    } catch (error) {
        console.log(error.response);
        console.log(error.response?.data);
        return rejectWithValue(error.response?.data?.message);
    }
});
export const loginUser=createAsyncThunk("auth/loginUser", async ({email,password},{rejectWithValue}) => {
    try {
        const res=await axios.post("/api/v1/users/login",{email,password});
        return res.data.data;
    } catch (error) {
        console.log(error.response);
        console.log(error.response?.data);
       return rejectWithValue(error.response?.data?.message);
    }
});
export const logoutUser=createAsyncThunk("auth/logoutUser", async (_, {rejectWithValue}) => {
    try {
        await axios.post("/api/v1/users/logout");
    } catch (error) {
        console.log(error.response);
        console.log(error.response?.data);
        return rejectWithValue(error.response?.data?.message);
    }
})
const authSlice=createSlice({
    name:"auth",
    initialState:{
        user:null,
        loading:false,
        error:null
    },
    reducers:{}
    ,
    extraReducers:(builder)=>{
        builder
        .addCase(registerUser.pending,(state)=>{
            state.loading=true;
            state.error=null;
        })
       .addCase(registerUser.fulfilled,(state,action)=>{
            state.loading=false;
            state.user=action.payload;
        })
        .addCase(registerUser.rejected,(state,action)=>{
            state.loading=false;
            state.error=action.payload;
        })
        .addCase(loginUser.pending,(state)=>{
            state.loading=true;
            state.error=null;
        })
        .addCase(loginUser.fulfilled,(state,action)=>{
            state.loading=false;
            state.user=action.payload;
        })
        .addCase(loginUser.rejected,(state,action)=>{
            state.loading=false;
            state.error=action.payload;
        })
        .addCase(logoutUser.pending,(state)=>{
            state.loading=true;
            state.error=null;
            state.user=null;
        })
        .addCase(logoutUser.fulfilled,(state)=>{
            state.loading=false;
            state.user=null;
        })
        .addCase(logoutUser.rejected,(state,action)=>{
            state.loading=false;
            state.user=null;
            state.error=action.payload;
        })
        .addCase(updateUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        })
        .addCase(updateUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
    }
})
export default authSlice.reducer;