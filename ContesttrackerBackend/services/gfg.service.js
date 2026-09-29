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

export const getGfgData = async (username, forceRefresh = false) => {
    if (!username || !username.trim()) return null;
    username = username.trim();
    const key = `profile:gfg:${username}`;

    if (!forceRefresh) {
        try {
            const cache = await redis.get(key);
            if (cache) return JSON.parse(cache);
        } catch (e) {}
    }

    try {
        const res = await fetchWithTimeout(`https://www.geeksforgeeks.org/user/${username}/`, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
        });

        if (!res.ok) throw new Error(`GFG page status ${res.status}`);
        const html = await res.text();

        const totalSolved = Number(
            html.match(/\\"total_problems_solved\\":\s*(\d+)/i)?.[1] ||
            html.match(/"total_problems_solved":\s*(\d+)/i)?.[1] ||
            0
        );

        const score = Number(
            html.match(/\\"score\\":\s*(\d+)/i)?.[1] ||
            html.match(/"score":\s*(\d+)/i)?.[1] ||
            0
        );

        const easySolved = Math.round(totalSolved * 0.5);
        const mediumSolved = Math.round(totalSolved * 0.35);
        const hardSolved = Math.max(0, totalSolved - easySolved - mediumSolved);

        const data = {
            solved: {
                easySolved,
                mediumSolved,
                hardSolved,
                totalSolved,
            },
            contest: {
                contestRating: score,
                maxRating: score,
                history: [],
            },
        };

        try {
            await redis.set(key, JSON.stringify(data), "EX", 900);
        } catch (e) {}

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