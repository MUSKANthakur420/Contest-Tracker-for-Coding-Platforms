import redis from "../config/redis.js";

const fetchWithTimeout = async (url, options = {}, ms = 4000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

export const getGfgData = async (username, forceRefresh = false) => {
    if (!username || !username.trim()) return null;
    username = username.trim();
    const key = `profile:gfg:${username}`;

    if (!forceRefresh) {
        const cache = await redis.get(key);
        if (cache) return JSON.parse(cache);
    }

    try {
        const [profileRes, statsRes, ratingRes] = await Promise.all([
            fetchWithTimeout(`https://gfg-stats.tashif.codes/${username}`),
            fetchWithTimeout(`https://gfg-stats.tashif.codes/${username}/stats`),
            fetchWithTimeout(`https://gfg-stats.tashif.codes/${username}/rating`),
        ]);

        if (!profileRes.ok || !statsRes.ok || !ratingRes.ok) {
            throw new Error("GFG user not found or API unavailable");
        }

        const profileJson = await profileRes.json();
        const statsJson = await statsRes.json();
        const ratingJson = await ratingRes.json();

        if (
            profileJson.status !== "success" ||
            statsJson.status !== "success" ||
            ratingJson.status !== "success"
        ) {
            throw new Error("GFG user not found");
        }

        const profileData = profileJson.data;
        const statsData = statsJson.data;
        const ratingData = ratingJson.data;

        const easySolved = statsData.byDifficulty?.easy ?? 0;
        const mediumSolved = statsData.byDifficulty?.medium ?? 0;
        const hardSolved = statsData.byDifficulty?.hard ?? 0;

        const history = ratingData.history ?? [];
        const data = {
            solved: {
                easySolved,
                mediumSolved,
                hardSolved,
                totalSolved:
                    statsData.totalSolved ??
                    easySolved + mediumSolved + hardSolved,
            },

            contest: {
                contestRating:
                    ratingData.current ??
                    profileData.currentRating ??
                    0,

                maxRating:
                    ratingData.max ??
                    profileData.maxRating ??
                    0,

                history,
            },
        };

        await redis.set(key, JSON.stringify(data), "EX", 900);
        return data;
    } catch (err) {
        console.warn(`GFG fetch failed for ${username}:`, err.message);
        return {
            solved: {
                easySolved: 0,
                mediumSolved: 0,
                hardSolved: 0,
                totalSolved: 0,
            },
            contest: {
                contestRating: 0,
                maxRating: 0,
                history: [],
            },
        };
    }
};