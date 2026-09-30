import redis from "../config/redis.js";

// Per-user rate limit (authenticated requests)
const USER_LIMIT = 100; // requests per minute
const WINDOW_SECONDS = 60;

// Per-IP rate limit (unauthenticated requests) - separate counter to avoid
// one IP blocking all unauthenticated users
const IP_LIMIT = 30;

const limiter = async (req, res, next) => {
    if (process.env.LOAD_TEST === "true") {
        return next();
    }

    try {
        const userId = req.user?._id;
        const ip = req.ip || req.socket?.remoteAddress || "unknown";

        if (userId) {
            // Authenticated: use user ID as the key
            const key = `rate_limit:user:${userId}`;
            const cnt = await redis.incr(key);
            if (cnt === 1) {
                await redis.expire(key, WINDOW_SECONDS);
            }
            if (cnt > USER_LIMIT) {
                return res.status(429).json({
                    message: "Too many requests. Please try again after 1 minute"
                });
            }
            return next();
        }

        // Unauthenticated: use IP as the key (separate counter, lower limit)
        const key = `rate_limit:ip:${ip}`;
        const cnt = await redis.incr(key);
        if (cnt === 1) {
            await redis.expire(key, WINDOW_SECONDS);
        }
        if (cnt > IP_LIMIT) {
            return res.status(429).json({
                message: "Too many requests. Please try again after 1 minute"
            });
        }
        next();
    } catch (err) {
        // Fail open: if Redis is down, allow the request through
        // (better than blocking all traffic due to Redis outage)
        console.error("Rate limiter Redis error, allowing request:", err.message);
        next();
    }
};

export default limiter;