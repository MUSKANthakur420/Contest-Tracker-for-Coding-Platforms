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

export const getAtcoderData = async (username, forceRefresh = false) => {
    if (!username || !username.trim()) return null;
    username = username.trim();
    const key = `profile:atcoder:${username}`;

    if (!forceRefresh) {
        try {
            const cache = await redis.get(key);
            if (cache) return JSON.parse(cache);
        } catch (e) {}
    }

    try {
        const [profileRes, acRes] = await Promise.allSettled([
            fetchWithTimeout(`https://atcoder.jp/users/${username}`, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                },
            }),
            fetchWithTimeout(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/ac_rank?user=${username}`),
        ]);

        let rating = 0;
        let maxRating = 0;
        if (profileRes.status === "fulfilled" && profileRes.value.ok) {
            const html = await profileRes.value.text();
            rating = Number(html.match(/Rating<\/th>\s*<td><span[^>]*>(\d+)/i)?.[1] || 0);
            maxRating = Number(html.match(/Highest Rating<\/th>\s*<td><span[^>]*>(\d+)/i)?.[1] || 0);
        }

        let accepted_count = 0;
        if (acRes.status === "fulfilled" && acRes.value.ok) {
            try {
                const acJson = await acRes.value.json();
                accepted_count = acJson.count ?? 0;
            } catch (e) {}
        }

        const data = {
            rating,
            maxRating,
            accepted_count,
            contest: {
                contestRating: rating,
                maxRating,
                history: [],
            },
        };

        try {
            await redis.set(key, JSON.stringify(data), "EX", 900);
        } catch (e) {}

        return data;
    } catch (err) {
        console.warn(`AtCoder fetch failed for ${username}:`, err.message);
        return {
            rating: 0,
            maxRating: 0,
            accepted_count: 0,
            contest: {
                contestRating: 0,
                maxRating: 0,
                history: [],
            },
        };
    }
};