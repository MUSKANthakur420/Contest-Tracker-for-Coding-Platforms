import * as cheerio from "cheerio";
import redis from "../config/redis.js";
const PROFILE_URL = (username) =>
    `https://hackerrank.com/profile/${username}`;

const BADGES_URL = (username) =>
    `https://hackerrank.com/rest/hackers/${username}/badges`;

const CONTEST_URL = (username) =>
    `https://hackerrank.com/profile/${username}/contest_history`;

const HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    Accept: "application/json, text/html",
};

// Find HackerRank's embedded React state
const findEmbeddedJson = ($, keys) => {
    let found = null;

    $('script[type="application/json"]').each((_, el) => {
        if (found) return;

        try {
            const parsed = JSON.parse($(el).contents().text());

            const hasAllKeys = keys.every((key) =>
                JSON.stringify(parsed).includes(`"${key}"`)
            );

            if (hasAllKeys) {
                found = parsed;
            }
        } catch {
            // Ignore invalid JSON
        }
    });

    return found;
};

export const getHackerrankData = async (username) => {
    if(!username) return null;
    if (!username?.trim()) {
        throw new Error("HackerRank username is required.");
    }
    const key=`profile:hackerrank:${username}`;
    const cache=await redis.get(key);
    if(cache) return JSON.parse(cache);
    console.log(`Starting HackerRank data fetch for: ${username}`);

    const [profileRes, badgesRes, contestRes] = await Promise.all([
        fetch(PROFILE_URL(username), {
            headers: HEADERS,
        }),

        fetch(BADGES_URL(username), {
            headers: HEADERS,
        }),

        fetch(CONTEST_URL(username), {
            headers: HEADERS,
        }),
    ]);

    console.log(
        `Fetch complete. Statuses - Profile: ${profileRes.status}, Badges: ${badgesRes.status}, Contests: ${contestRes.status}`
    );

    if (profileRes.status === 404) {
        throw new Error(
            `User "${username}" does not exist on HackerRank.`
        );
    }

    if (!profileRes.ok) {
        throw new Error(
            `Failed to load HackerRank profile (Status: ${profileRes.status}).`
        );
    }

    // =========================
    // PROFILE
    // =========================

    const html = await profileRes.text();
    const $ = cheerio.load(html);

    const state = findEmbeddedJson($, ["hacker", "score"]);

    // =========================
    // BADGES
    // =========================

    let badges = [];

    if (badgesRes.ok) {
        try {
            const data = await badgesRes.json();

            badges = data?.models ?? data?.badges ?? [];
        } catch {
            console.warn("Could not parse HackerRank badges.");
        }
    }

    // =========================
    // CONTEST HISTORY
    // =========================

    let contestInfo = {
        currentRating: 0,
        highestRating: 0,
        history: [],
    };

    if (contestRes.ok) {
        try {
            const data = await contestRes.json();

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

            // =========================
            // CURRENT + HIGHEST RATING
            // =========================

            if (contestInfo.history.length > 0) {
                const ratings = contestInfo.history
                    .map((contest) => contest.rating)
                    .filter((rating) => typeof rating === "number");

                if (ratings.length > 0) {
                    contestInfo.currentRating =
                        ratings[ratings.length - 1];

                    contestInfo.highestRating =
                        Math.max(...ratings);
                }
            }
        } catch (err) {
            console.error(
                "Could not parse HackerRank contest history:",
                err.message
            );
        }
    }
    const data={
        username,
    
        solved: state?.hacker?.solved_challenges_count ?? 0,
    
        stars: state?.hacker?.rank ?? 0,
    
        badges,
    
        contest: {
            contestRating: contestInfo.currentRating,
            maxRating: contestInfo.highestRating,
            history: contestInfo.history,
            }
        };
        await redis.set(key,JSON.stringify(data),"EX",900);
    // =========================
    // FINAL RESPONSE
    // =========================

    return data;
    };