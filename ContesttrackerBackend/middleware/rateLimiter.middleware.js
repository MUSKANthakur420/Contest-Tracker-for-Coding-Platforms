import redis from "../config/redis.js";

const limiter = async (req, res, next) => {

    if (process.env.LOAD_TEST === "true") {
        return next();
    }

    const identifier = req.user?._id || req.ip || "global";
    const key = `rate_limit:${identifier}`;

    const cnt = await redis.incr(key);

    if (cnt === 1) {
        await redis.expire(key, 60);
    }

    if (cnt > 10) {
        return res.status(429).json({
            message: "Too many requests. Please try again after 1 minute"
        });
    }

    next();
};

export default limiter;