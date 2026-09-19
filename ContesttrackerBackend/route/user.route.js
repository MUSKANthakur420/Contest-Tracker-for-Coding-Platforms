import { Router } from "express";
import { VerifyJWT } from "../middleware/auth.middleware.js";
import { 
    login, logout, register, deleteUser, updateUser, getCurrentUser 
} from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import {
    dashboard,
    refreshDashboard,
    dashboardStatus,
  } from "../controller/dashboard.controller.js";
import { getUpcomingContests } from "../controller/contest.controller.js";
import limiter from "../middleware/rateLimiter.middleware.js";

const router = Router();

router.route("/").get((req, res) => {
    res.send("User route is working");
});
router.route("/register").post(
    upload.fields([{ name: "image", maxCount: 1 }]), 
    register
);

router.route("/login").post((req, res, next) => {
    next();
}, login);

router.route("/logout").post(VerifyJWT, logout);

router.route("/updateAccount").post(
    VerifyJWT, 
    upload.fields([{ name: "image", maxCount: 1 }]), 
    updateUser
);

router.route("/delete").post(VerifyJWT, deleteUser);
router.route("/dashboard").get(
    VerifyJWT,
    dashboard
);
router.get(
    "/dashboard/status/:jobId",
    VerifyJWT,
    dashboardStatus
  );
router.route("/contests").get(getUpcomingContests);
router.route("/me").get(VerifyJWT, getCurrentUser);
router.post(
    "/refresh",
    VerifyJWT,
    limiter,
    refreshDashboard
);
export default router;
