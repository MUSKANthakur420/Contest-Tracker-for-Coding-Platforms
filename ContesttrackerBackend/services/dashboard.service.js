import { LeetcodeData } from "./leetcode.service.js";
import { getCodeforcesData } from "./codeforces.service.js";
import { getAtcoderData } from "./atcoder.service.js";
import { getGfgData } from "./gfg.service.js";
import { getHackerrankData } from "./hackerrank.service.js";
import { getNaukriData } from "./naukri.service.js";

const EMPTY_LEETCODE = {
    solved: {
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        solvedProblem: 0,
    },
    contest: {
        contestRating: 0,
    },
    history: [],
    calendar: null,
};

const EMPTY_CODEFORCES = {
    submissions: { result: [] },
    info: {
        result: [
            {
                rating: 0,
                maxRating: 0,
                rank: "unrated",
            },
        ],
    },
    rating: { result: [] },
};

const EMPTY_GFG = {
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

const EMPTY_ATCODER = {
    accepted_count: 0,
};

const EMPTY_HACKERRANK = {
    solved: 0,
    stars: 0,
    badges: [],
    contest: {
        contestRating: 0,
        maxRating: 0,
        history: [],
    },
};

const EMPTY_NAUKRI = {
    solved: {
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        totalSolved: 0,
    },
    rank: null,
    streak: 0,
};

const hasUsername = (u) =>
    typeof u === "string" && u.trim().length > 0;

const PROFILE_URL = {
    leetcode: (u) => `https://leetcode.com/${u}`,
    codeforces: (u) => `https://codeforces.com/profile/${u}`,
    atcoder: (u) => `https://atcoder.jp/users/${u}`,
    gfg: (u) => `https://www.geeksforgeeks.org/user/${u}/`,
    hackerrank: (u) => `https://www.hackerrank.com/profile/${u}`,
    naukri: (u) => `https://www.naukri.com/code360/profile/${u}`,
};

const buildPlatformEntry = (platformKey, username) => {
    if (!hasUsername(username)) {
        return { connected: false };
    }

    return {
        connected: true,
        username,
        profileUrl: PROFILE_URL[platformKey](username),
    };
};

export const getDashboardData = async (user = {}) => {
    console.log("GET DASHBOARD DATA START");

    const { codingProfiles = {} } = user;

    const {
        leetcode,
        codeforces,
        atcoder,
        gfg,
        hackerrank,
        naukri,
    } = codingProfiles;

    console.log("USER PROFILES:", {
        leetcode,
        codeforces,
        atcoder,
        gfg,
        hackerrank,
        naukri,
    });

    console.log("HAS USERNAME:", {
        leetcode: hasUsername(leetcode),
        codeforces: hasUsername(codeforces),
        atcoder: hasUsername(atcoder),
        gfg: hasUsername(gfg),
        hackerrank: hasUsername(hackerrank),
        naukri: hasUsername(naukri),
    });

    console.time("PLATFORM CALLS");

    const [
        leetcodeResult,
        codeforcesResult,
        atcoderResult,
        gfgResult,
        hackerrankResult,
        naukriResult,
    ] = await Promise.allSettled([
        hasUsername(leetcode)
            ? LeetcodeData(leetcode)
            : Promise.resolve(EMPTY_LEETCODE),

        hasUsername(codeforces)
            ? getCodeforcesData(codeforces)
            : Promise.resolve(EMPTY_CODEFORCES),

        hasUsername(atcoder)
            ? getAtcoderData(atcoder)
            : Promise.resolve(EMPTY_ATCODER),

        hasUsername(gfg)
            ? getGfgData(gfg)
            : Promise.resolve(EMPTY_GFG),

        hasUsername(hackerrank)
            ? getHackerrankData(hackerrank)
            : Promise.resolve(EMPTY_HACKERRANK),

        hasUsername(naukri)
            ? getNaukriData(naukri)
            : Promise.resolve(EMPTY_NAUKRI),
    ]);

    console.timeEnd("PLATFORM CALLS");

    const leetcodeData =
        leetcodeResult.status === "fulfilled"
            ? leetcodeResult.value
            : EMPTY_LEETCODE;

    const codeforcesData =
        codeforcesResult.status === "fulfilled"
            ? codeforcesResult.value
            : EMPTY_CODEFORCES;

    const atcoderData =
        atcoderResult.status === "fulfilled"
            ? atcoderResult.value
            : EMPTY_ATCODER;

    const gfgData =
        gfgResult.status === "fulfilled"
            ? gfgResult.value
            : EMPTY_GFG;

    const hackerrankData =
        hackerrankResult.status === "fulfilled"
            ? hackerrankResult.value
            : EMPTY_HACKERRANK;

    const naukriData =
        naukriResult.status === "fulfilled"
            ? naukriResult.value
            : EMPTY_NAUKRI;

    const failures = [
        leetcodeResult,
        codeforcesResult,
        atcoderResult,
        gfgResult,
        hackerrankResult,
        naukriResult,
    ]
        .filter((r) => r.status === "rejected")
        .map((r) => r.reason?.message || String(r.reason));

    if (failures.length) {
        console.warn(
            "Dashboard: some platforms failed to load:",
            failures
        );
    }

    // ----------------------------------------
    // CODEFORCES SUBMISSIONS
    // ----------------------------------------

    const submissions =
        codeforcesData.submissions?.result ?? [];

    const solvedProblems = new Set();
    const activeDays = new Set();
    const activeDaysCounts = {};
    const ratingBuckets = {};

    for (const sub of submissions) {
        if (sub.verdict !== "OK") continue;

        solvedProblems.add(
            `${sub.problem.contestId}-${sub.problem.index}`
        );

        const date = new Date(
            sub.creationTimeSeconds * 1000
        )
            .toISOString()
            .split("T")[0];

        activeDays.add(date);

        activeDaysCounts[date] =
            (activeDaysCounts[date] || 0) + 1;

        const rating = sub.problem.rating;

        if (rating) {
            ratingBuckets[rating] =
                (ratingBuckets[rating] || 0) + 1;
        }
    }

    // ----------------------------------------
    // LEETCODE CALENDAR
    // ----------------------------------------

    const lcCalendar =
        leetcodeData.calendar?.submissionCalendar;

    if (lcCalendar) {
        try {
            const parsed = JSON.parse(lcCalendar);

            for (const [unixSeconds, count] of Object.entries(parsed)) {
                const date = new Date(
                    Number(unixSeconds) * 1000
                )
                    .toISOString()
                    .split("T")[0];

                activeDays.add(date);

                activeDaysCounts[date] =
                    (activeDaysCounts[date] || 0) +
                    Number(count || 0);
            }
        } catch {
            // malformed calendar string
        }
    }

    // ----------------------------------------
    // CODEFORCES INFO
    // ----------------------------------------

    const cfInfo =
        codeforcesData.info?.result?.[0] ?? {};

    // ----------------------------------------
    // FINAL DASHBOARD RESPONSE
    // ----------------------------------------

    return {
        // ========================================
        // LEETCODE
        // ========================================

        easy:
            leetcodeData.solved?.easySolved ?? 0,

        medium:
            leetcodeData.solved?.mediumSolved ?? 0,

        hard:
            leetcodeData.solved?.hardSolved ?? 0,

        leetcodeSolved:
            leetcodeData.solved?.solvedProblem ?? 0,

        leetcodeRating:
            leetcodeData.contest?.contestRating ?? 0,

        leetcodeHistory:
            leetcodeData.history ?? [],

        // ========================================
        // CODEFORCES
        // ========================================

        codeforcesSolved:
            solvedProblems.size,

        codeforcesRating:
            cfInfo.rating ?? 0,

        codeforcesMaxRating:
            cfInfo.maxRating ?? 0,

        codeforcesRank:
            cfInfo.rank ?? "unrated",

        codeforcesRatingHistory:
            codeforcesData.rating?.result ?? [],

        codeforcesRatingBuckets:
            ratingBuckets,

        // ========================================
        // ATCODER
        // ========================================

        atcoderSolved:
            atcoderData.accepted_count ?? 0,

        // ========================================
        // GFG
        // ========================================

        easygfg:
            gfgData.solved?.easySolved ?? 0,

        mediumgfg:
            gfgData.solved?.mediumSolved ?? 0,

        hardgfg:
            gfgData.solved?.hardSolved ?? 0,

        gfgSolved:
            gfgData.solved?.totalSolved ?? 0,

        gfgRating:
            gfgData.contest?.contestRating ?? 0,

        gfgMaxRating:
            gfgData.contest?.maxRating ?? 0,

        gfgRatingHistory:
            gfgData.contest?.history ?? [],

        // ========================================
        // HACKERRANK
        // ========================================

        hackerrankSolved:
            hackerrankData.solved ?? 0,

        hackerrankStars:
            hackerrankData.stars ?? 0,

        hackerrankBadges:
            hackerrankData.badges ?? [],

        hackerrankRating:
            hackerrankData.contest?.contestRating ?? 0,

        hackerrankMaxRating:
            hackerrankData.contest?.maxRating ?? 0,

        hackerrankRatingHistory:
            hackerrankData.contest?.history ?? [],

        // ========================================
        // CODE360 / NAUKRI
        // ========================================

        easynaukri:
            naukriData.solved?.easySolved ?? 0,

        mediumnaukri:
            naukriData.solved?.mediumSolved ?? 0,

        hardnaukri:
            naukriData.solved?.hardSolved ?? 0,

        naukriSolved:
            naukriData.solved?.totalSolved ?? 0,

        naukriRank:
            naukriData.rank ?? null,

        naukriStreak:
            naukriData.streak ?? 0,

        // ========================================
        // COMBINED
        // ========================================

        totalSolved:
            (leetcodeData.solved?.solvedProblem ?? 0) +
            solvedProblems.size +
            (gfgData.solved?.totalSolved ?? 0) +
            (atcoderData.accepted_count ?? 0) +
            (hackerrankData.solved ?? 0) +
            (naukriData.solved?.totalSolved ?? 0),

        // ========================================
        // ACTIVITY
        // ========================================

        activeDays:
            activeDays.size,

        activeDaysList:
            Array.from(activeDays).sort(),

        activeDaysCounts,

        // ========================================
        // USER PROFILE
        // ========================================

        profile: {
            name: user.username,
            username: user.username,
            avatar: user.image,
        },

        // ========================================
        // CONNECTED PLATFORMS
        // ========================================

        connectedPlatforms: {
            leetcode:
                buildPlatformEntry(
                    "leetcode",
                    leetcode
                ),

            codeforces:
                buildPlatformEntry(
                    "codeforces",
                    codeforces
                ),

            atcoder:
                buildPlatformEntry(
                    "atcoder",
                    atcoder
                ),

            gfg:
                buildPlatformEntry(
                    "gfg",
                    gfg
                ),

            hackerrank:
                buildPlatformEntry(
                    "hackerrank",
                    hackerrank
                ),

            naukri:
                buildPlatformEntry(
                    "naukri",
                    naukri
                ),
        },
    };
};