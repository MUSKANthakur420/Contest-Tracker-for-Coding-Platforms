import User from "../model/user.model.js";
import Apierr from "../utils/Apierr.js";
import Apires from "../utils/Apires.js";
import asynchandler from "../utils/asynchandler.js";
import uploadFileOnCloudinary from "../utils/cloudinary.js";

const AccessTokenandRefreshToken = async (userid) => {
    try {
        const user = await User.findById(userid);

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new Apierr(404, error.message);
    }
};

const getCurrentUser = asynchandler(async (req, res) => {
    return res.status(200).json(
        new Apires(200, "User fetched successfully", req.user)
    );
});

const register = asynchandler(async (req, res) => {
    const {
        username,
        phone,
        email,
        password,
        leetcode,
        codeforces,
        codechef,
        atcoder,
        gfg,
        hackerrank,
        naukri
    } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json(
            new Apires(400, "All fields are required", null)
        );
    }

    const localFilePath = req.files?.image?.[0]?.path;

    let image = "";

    if (localFilePath) {
        const uploadImage = await uploadFileOnCloudinary(localFilePath);
        image = uploadImage?.secure_url || "";
    }

    const newUser = await User.create({
        username,
        phone,
        email,
        password,
        image,
        codingProfiles: {
            leetcode: leetcode || "",
            codeforces: codeforces || "",
            codechef: codechef || "",
            atcoder: atcoder || "",
            gfg: gfg || "",
            hackerrank: hackerrank || "",
            naukri: naukri || ""
        }
    });
    const { accessToken, refreshToken } =
    await AccessTokenandRefreshToken(newUser._id);

const registeredUser = await User.findById(newUser._id)
    .select("-password -refreshToken");

const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
};

return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new Apires(201, "User registered successfully", {
            user: registeredUser
        })
    )});

const login = asynchandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json(
            new Apires(404, "User is invalid")
        );
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json(
            new Apierr(401, "Invalid credentials")
        );
    }

    const { accessToken, refreshToken } =
        await AccessTokenandRefreshToken(user._id);

    const newuser = await User.findById(user._id)
        .select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new Apires(200, "User logged in successfully", {
                user: newuser
            })
        );
});

const logout = asynchandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(400).json(
            new Apierr(400, "User not found", null)
        );
    }

    await User.findByIdAndUpdate(
        user._id,
        { refreshToken: null },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new Apires(200, "User logged out successfully", {})
        );
});

const updateUser = asynchandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(400).json(
            new Apierr(400, "User not found")
        );
    }

    const {
        username,
        email,
        password,
        leetcode,
        codeforces,
        atcoder,
        gfg,
        hackerrank,
        naukri
    } = req.body;

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = password;

    user.codingProfiles.leetcode =
        leetcode ?? user.codingProfiles.leetcode;

    user.codingProfiles.codeforces =
        codeforces ?? user.codingProfiles.codeforces;

    user.codingProfiles.atcoder =
        atcoder ?? user.codingProfiles.atcoder;

    user.codingProfiles.gfg =
        gfg ?? user.codingProfiles.gfg;

    user.codingProfiles.hackerrank =
        hackerrank ?? user.codingProfiles.hackerrank;

    user.codingProfiles.naukri =
        naukri ?? user.codingProfiles.naukri;

    if (req.files?.image?.[0]) {
        const uploadImage = await uploadFileOnCloudinary(
            req.files.image[0].path
        );

        user.image = uploadImage?.secure_url;
    }

    await user.save();

    return res.status(200).json(
        new Apires(200, "User updated successfully", user)
    );
});

const deleteUser = asynchandler(async (req, res) => {
    const { email } = req.body;

    const existUser = await User.findOne({ email });

    if (!existUser) {
        return res.status(400).json(
            new Apierr(400, "User not found", null)
        );
    }

    await User.findByIdAndDelete(existUser._id);

    return res.status(200).json(
        new Apires(200, "User deleted successfully", {})
    );
});

export {
    register,
    login,
    logout,
    updateUser,
    deleteUser,
    getCurrentUser
};