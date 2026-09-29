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

export const getCodechefData = async (username, forceRefresh = false) => {
    if (!username || !username.trim()) return null;
    username = username.trim();
    const key = `profile:codechef:${username}`;

    if (!forceRefresh) {
        const cache = await redis.get(key);
        if (cache) return JSON.parse(cache);
    }

    try {
        const res = await fetchWithTimeout(`https://codechef-api.vercel.app/handle/${username}`);
        if (!res.ok) throw new Error("CodeChef API error");
        const json = await res.json();

        const data = {
            rating: json.currentRating ?? 0,
            maxRating: json.highestRating ?? 0,
            stars: json.stars ?? "unrated",
            globalRank: json.globalRank ?? null,
            countryRank: json.countryRank ?? null,
            solved: json.totalSolved ?? 0,
        };

        await redis.set(key, JSON.stringify(data), "EX", 900);
        return data;
    } catch (err) {
        console.warn(`CodeChef fetch failed for ${username}:`, err.message);
        return {
            rating: 0,
            maxRating: 0,
            stars: "unrated",
            globalRank: null,
            countryRank: null,
            solved: 0,
        };
    }
};
