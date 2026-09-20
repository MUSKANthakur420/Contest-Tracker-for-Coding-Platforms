import "dotenv/config";
import { Worker } from "bullmq";
import Redis from "ioredis";
import { getDashboardData } from "../services/dashboard.service.js";
import User from "../model/user.model.js";
import connnect_db from "../db/index.js";

await connnect_db();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

console.log("REDIS URL:", redisUrl);

const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
});

const redis = new Redis(redisUrl);

connection.on("connect", () => {
    console.log("✅ BullMQ Redis connected");
});

connection.on("error", (err) => {
    console.error("❌ BullMQ Redis error:", err);
});

const worker = new Worker(
    "dashboard",
    async (job) => {
        console.log("🔥 WORKER RECEIVED:", job.id, job.data);

        const { userId } = job.data;

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        console.log(`Processing dashboard for ${user._id}`);

        const dashboardData = await getDashboardData(user);

        await redis.set(
            `dashboard:${user._id}`,
            JSON.stringify(dashboardData),
            "EX",
            300
        );

        await redis.del(`dashboard:refreshing:${userId}`);

        console.log(`Dashboard cached for ${user._id}`);

        return dashboardData;
    },
    {
        connection,
        concurrency: 5,
    }
);

worker.on("ready", () => {
    console.log("🟢 WORKER READY");
});

worker.on("active", (job) => {
    console.log("🟡 WORKER ACTIVE:", job.id);
});

worker.on("error", (err) => {
    console.error("❌ WORKER ERROR:", err);
});

console.log("🚀 Dashboard worker started...");