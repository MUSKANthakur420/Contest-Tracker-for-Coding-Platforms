import redis from "../config/redis.js";

const fetchWithTimeout = async (url, options = {}, ms = 6000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

export const getCodeforcesData = async (handle, forceRefresh = false) => {
    if (!handle) return null;
    handle = handle.trim();
    const key = `profile:codeForces:${handle}`;

    if (!forceRefresh) {
        const cache = await redis.get(key);
        if (cache) return JSON.parse(cache);
    }

    try {
        const [infoRes, ratingRes, submissionsRes] = await Promise.all([
            fetchWithTimeout(`https://codeforces.com/api/user.info?handles=${handle}`),
            fetchWithTimeout(`https://codeforces.com/api/user.rating?handle=${handle}`),
            fetchWithTimeout(`https://codeforces.com/api/user.status?handle=${handle}`),
        ]);

        const data = {
            info: infoRes.ok ? await infoRes.json() : { result: [] },
            rating: ratingRes.ok ? await ratingRes.json() : { result: [] },
            submissions: submissionsRes.ok ? await submissionsRes.json() : { result: [] },
        };

        await redis.set(key, JSON.stringify(data), "EX", 900);
        return data;
    } catch (err) {
        console.warn(`Codeforces fetch failed for ${handle}:`, err.message);
        return {
            submissions: { result: [] },
            info: { result: [{ rating: 0, maxRating: 0, rank: "unrated" }] },
            rating: { result: [] },
        };
    }
};