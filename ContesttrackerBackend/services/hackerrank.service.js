import redis from "../config/redis.js";

const PROFILE_URL = (username) =>
    `https://www.hackerrank.com/rest/hackers/${username}/profile`;

const BADGES_URL = (username) =>
    `https://www.hackerrank.com/rest/hackers/${username}/badges`;

const CONTEST_URL = (username) =>
    `https://www.hackerrank.com/rest/hackers/${username}/contest_history`;

const HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    Accept: "application/json",
};

export const getHackerrankData = async (username, forceRefresh = false) => {
    if (!username?.trim()) {
        throw new Error("HackerRank username is required.");
    }

    username = username.trim();
    const key = `profile:hackerrank:${username}`;
    if (!forceRefresh) {
        const cache = await redis.get(key);
        if (cache) return JSON.parse(cache);
    }
    console.log(`Starting HackerRank data fetch for: ${username}`);

    const [profileRes, badgesRes, contestRes] = await Promise.allSettled([
        fetch(PROFILE_URL(username), { headers: HEADERS }),
        fetch(BADGES_URL(username), { headers: HEADERS }),
        fetch(CONTEST_URL(username), { headers: HEADERS }),
    ]);

    let solved = 0;
    let stars = 0;
    let badges = [];
    let contestInfo = {
        currentRating: 0,
        highestRating: 0,
        history: [],
    };

    if (profileRes.status === "fulfilled" && profileRes.value.ok) {
        try {
            const profileJson = await profileRes.value.json();
            const model = profileJson?.model ?? {};
            solved = model.solved_challenges_count ?? model.score ?? 0;
            stars = model.rank ?? model.level ?? 0;
        } catch (err) {
            console.warn("Error parsing HackerRank profile JSON:", err.message);
        }
    }

    if (badgesRes.status === "fulfilled" && badgesRes.value.ok) {
        try {
            const data = await badgesRes.value.json();
            badges = data?.models ?? data?.badges ?? [];
        } catch (err) {
            console.warn("Could not parse HackerRank badges:", err.message);
        }
    }

    if (contestRes.status === "fulfilled" && contestRes.value.ok) {
        try {
            const data = await contestRes.value.json();
            const models = data?.models ?? [];
            const history = data?.history ?? [];

            contestInfo.history = history.map((performance, index) => {
                const meta = models[index] || {};
                return {
                    name: meta.contest_name ?? "",
                    slug: meta.contest_slug ?? "",
                    startTime: meta.epoch_starttime ?? null,
                    endTime: meta.epoch_endtime ?? null,
                    rating: performance.rating ?? 0,
                    rank: performance.rank ?? null,
                    score: performance.score ?? 0,
                    percentile: performance.percentile ?? 0,
                };
            });

            if (contestInfo.history.length > 0) {
                const ratings = contestInfo.history
                    .map((c) => c.rating)
                    .filter((r) => typeof r === "number");

                if (ratings.length > 0) {
                    contestInfo.currentRating = ratings[ratings.length - 1];
                    contestInfo.highestRating = Math.max(...ratings);
                }
            }
        } catch (err) {
            console.warn("Could not parse HackerRank contest history:", err.message);
        }
    }

    const data = {
        username,
        solved,
        stars,
        badges,
        contest: {
            contestRating: contestInfo.currentRating,
            maxRating: contestInfo.highestRating,
            history: contestInfo.history,
        },
    };

    await redis.set(key, JSON.stringify(data), "EX", 900);
    return data;
};