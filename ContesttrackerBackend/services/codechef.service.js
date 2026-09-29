import redis from "../config/redis.js";

const fetchWithTimeout = async (url, options = {}, ms = 8000) => {
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
        try {
            const cache = await redis.get(key);
            if (cache) return JSON.parse(cache);
        } catch (e) {}
    }

    try {
        const res = await fetchWithTimeout(`https://www.codechef.com/users/${username}`, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
        });

        if (!res.ok) throw new Error(`CodeChef page returned status ${res.status}`);

        const html = await res.text();

        const rating = Number(
            html.match(/class="rating-number"[^>]*>\s*(\d+)/i)?.[1] ||
            html.match(/rating-header[\s\S]*?class="rating-number">(\d+)/i)?.[1] ||
            0
        );

        const maxRating = Number(
            html.match(/\(Highest Rating\s*(\d+)\)/i)?.[1] ||
            html.match(/Highest Rating\s*(\d+)/i)?.[1] ||
            0
        );

        const solved = Number(
            html.match(/Total Problems Solved:\s*(\d+)/i)?.[1] ||
            html.match(/Fully Solved\s*\((?:<b>)?(\d+)/i)?.[1] ||
            html.match(/Total Problems Solved<\/h3>\s*<p>(\d+)/i)?.[1] ||
            0
        );

        const starCount =
            (html.match(/class="rating-star"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "").match(
                /&#9733;|★/g
            )?.length || 0;

        const stars = starCount > 0 ? `${starCount}★` : "unrated";

        const data = {
            rating,
            maxRating,
            stars,
            solved,
        };

        try {
            await redis.set(key, JSON.stringify(data), "EX", 900);
        } catch (e) {}

        return data;
    } catch (err) {
        console.warn(`CodeChef fetch failed for ${username}:`, err.message);
        return {
            rating: 0,
            maxRating: 0,
            stars: "unrated",
            solved: 0,
        };
    }
};
