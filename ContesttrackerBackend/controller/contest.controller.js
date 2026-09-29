import asynchandler from "../utils/asynchandler.js";
import Apires from "../utils/Apires.js";
import redis from "../config/redis.js";

const CACHE_KEY = "contests:upcoming";
const CACHE_TTL_OK = 600; // 10 min when every platform answered
const CACHE_TTL_PARTIAL = 60; // 1 min when some platform failed, so it retries soon

const BROWSER_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/124.0 Safari/537.36",
    Accept: "application/json",
};

// Wraps any fetch with a hard timeout — if a platform's API hangs, this
// aborts it after `ms` instead of blocking the whole route forever.
const fetchWithTimeout = async (url, options = {}, ms = 6000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

const fetchCodeforcesContests = async () => {
    const res = await fetchWithTimeout("https://codeforces.com/api/contest.list");
    const json = await res.json();
    if (json.status !== "OK") throw new Error("Codeforces API error");

    return json.result
        .filter((c) => c.phase === "BEFORE")
        .map((c) => ({
            id: `cf-${c.id}`,
            name: c.name,
            platform: "Codeforces",
            startTime: c.startTimeSeconds * 1000,
            url: `https://codeforces.com/contest/${c.id}`,
        }));
};

const fetchLeetcodeContests = async () => {
    const query = `
        query {
            upcomingContests {
                title
                titleSlug
                startTime
            }
        }
    `;
    const res = await fetchWithTimeout("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    const json = await res.json();

    return (json.data?.upcomingContests ?? []).map((c) => ({
        id: `lc-${c.titleSlug}`,
        name: c.title,
        platform: "LeetCode",
        startTime: c.startTime * 1000,
        url: `https://leetcode.com/contest/${c.titleSlug}`,
    }));
};

const fetchAtCoderContests = async () => {
    const res = await fetchWithTimeout(
        "https://kenkoooo.com/atcoder/resources/contests.json"
    );
    const json = await res.json();
    const nowSeconds = Date.now() / 1000;

    return (json ?? [])
        .filter((c) => c.start_epoch_second > nowSeconds)
        .map((c) => ({
            id: `ac-${c.id}`,
            name: c.title,
            platform: "AtCoder",
            startTime: c.start_epoch_second * 1000,
            url: `https://atcoder.jp/contests/${c.id}`,
        }));
};

// Endpoint and field names below are from memory: test with curl first.
const fetchCodechefContests = async () => {
    const res = await fetchWithTimeout(
        "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all",
        { headers: BROWSER_HEADERS }
    );
    const json = await res.json();

    return (json.future_contests ?? []).map((c) => ({
        id: `cc-${c.contest_code}`,
        name: c.contest_name,
        platform: "CodeChef",
        startTime: new Date(c.contest_start_date_iso).getTime(),
        url: `https://www.codechef.com/${c.contest_code}`,
    }));
};

// Endpoint and field names below are from memory: test with curl first.
const fetchHackerrankContests = async () => {
    const res = await fetchWithTimeout(
        "https://www.hackerrank.com/rest/contests/upcoming?offset=0&limit=20",
        { headers: BROWSER_HEADERS }
    );
    const json = await res.json();

    return (json.models ?? []).map((c) => ({
        id: `hr-${c.slug}`,
        name: c.name,
        platform: "HackerRank",
        startTime: c.epoch_starttime * 1000,
        url: `https://www.hackerrank.com/contests/${c.slug}`,
    }));
};

// TODO: GeeksforGeeks and Code360 fetchers go here once their endpoints are
// found in DevTools. Add them to FETCHERS below and nothing else changes.
const FETCHERS = [
    ["Codeforces", fetchCodeforcesContests],
    ["LeetCode", fetchLeetcodeContests],
    ["AtCoder", fetchAtCoderContests],
    ["CodeChef", fetchCodechefContests],
    ["HackerRank", fetchHackerrankContests],
];

const onlyUpcoming = (list) => {
    const now = Date.now();
    return list
        .filter((c) => Number.isFinite(c.startTime) && c.startTime > now)
        .sort((a, b) => a.startTime - b.startTime);
};

export const getUpcomingContests = asynchandler(async (req, res) => {
    // 1. Serve from cache when possible (a Redis failure never breaks the route)
    try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
            return res
                .status(200)
                .json(new Apires(200, "Upcoming contests fetched", onlyUpcoming(JSON.parse(cached))));
        }
    } catch (err) {
        console.warn("Contests cache read failed:", err.message);
    }

    // 2. Fetch every platform in parallel; one failing doesn't affect the rest
    const results = await Promise.allSettled(FETCHERS.map(([, fn]) => fn()));

    let failed = 0;
    results.forEach((r, i) => {
        if (r.status === "rejected") {
            failed++;
            console.warn(`${FETCHERS[i][0]} contests failed:`, r.reason?.message || r.reason);
        }
    });

    const contests = onlyUpcoming(
        results.filter((r) => r.status === "fulfilled").flatMap((r) => r.value)
    );

    // 3. Cache: short TTL if anything failed so it retries soon
    try {
        await redis.set(
            CACHE_KEY,
            JSON.stringify(contests),
            "EX",
            failed ? CACHE_TTL_PARTIAL : CACHE_TTL_OK
        );
    } catch (err) {
        console.warn("Contests cache write failed:", err.message);
    }

    return res
        .status(200)
        .json(new Apires(200, "Upcoming contests fetched", contests));
});