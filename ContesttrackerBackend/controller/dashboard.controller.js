import { getDashboardData } from "../services/dashboard.service.js";
import asynchandler from "../utils/asynchandler.js";
import User from "../model/user.model.js";
import Apierr from "../utils/Apierr.js";
import Apires from "../utils/Apires.js";
import { dashboardQueue } from "../queues/dashboard.queue.js";
import redis from "../config/redis.js";

const dashboard = async (req, res) => {
  const cachedDashboard = await redis.get(
    `dashboard:${req.user._id}`
  );

  if (!cachedDashboard) {
    return res.status(404).json({
      success: false,
      message: "Dashboard data not available. Please refresh.",
    });
  }

  return res.status(200).json({
    success: true,
    data: JSON.parse(cachedDashboard),
  });
};
const refreshDashboard = asynchandler(async (req, res) => {
    const userId = req.user._id.toString();
    const lockKey = `dashboard:refreshing:${userId}`;
  
    console.log("REFRESH API CALLED");
  
    const acquired = await redis.set(
      lockKey,
      "1",
      "EX",
      60,
      "NX"
    );
  
    console.log("LOCK RESULT:", acquired);
  
    if (!acquired) {
      console.log("⚠️ REFRESH ALREADY LOCKED");
  
      return res.status(202).json(
        new Apires(
          202,
          "Dashboard refresh already in progress",
          null
        )
      );
    }
  
    try {
        const job = await dashboardQueue.add("refresh", {
            userId,
        });
    
        console.log("🔥 JOB ADDED:", job.id);
    
        const counts = await dashboardQueue.getJobCounts(
            "waiting",
            "active",
            "completed",
            "failed"
        );
    
        console.log("📊 QUEUE COUNTS:", counts);
    
        return res.status(202).json(
            new Apires(202, "Dashboard refresh started", {
                jobId: job.id,
            })
        );
    } catch (error) {
      console.error("❌ QUEUE ADD FAILED:", error);
  
      await redis.del(lockKey);
      throw error;
    }
  });

const dashboardStatus = asynchandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await dashboardQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  const state = await job.getState();

  return res.status(200).json({
    success: true,
    status: state,
  });
});

export {
  dashboard,
  refreshDashboard,
  dashboardStatus,
};