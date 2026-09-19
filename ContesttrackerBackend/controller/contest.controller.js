import  asynchandler  from "../utils/asynchandler.js";
import  Apires from "../utils/Apires.js";

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

export const getUpcomingContests = asynchandler(async (req, res) => {
    const results = await Promise.allSettled([
        fetchCodeforcesContests(),
        fetchLeetcodeContests(),
        fetchAtCoderContests(),
    ]);

    results.forEach((r, i) => {
        if (r.status === "rejected") {
            console.warn(`Contest fetch ${i} failed:`, r.reason?.message || r.reason);
        }
    });

    const contests = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .sort((a, b) => a.startTime - b.startTime);

        return res.status(200).json(
            new Apires(
                200,
                "Upcoming contests fetched",
                contests
            )
        );
});