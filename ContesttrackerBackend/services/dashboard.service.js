import { LeetcodeData } from "./leetcode.service.js";
import { getCodeforcesData } from "./codeforces.service.js";
import { getCodechefData } from "./codechef.service.js";
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

const EMPTY_CODECHEF = {
    rating: 0,
    maxRating: 0,
    stars: "unrated",
    globalRank: null,
    countryRank: null,
    solved: 0,
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

const hasUsername = (username) =>
    typeof username === "string" &&
    username.trim() !== "" &&
    username !== "undefined" &&
    username !== "null";

const PROFILE_URL = {
    leetcode: (u) => `https://leetcode.com/${u}`,
    codeforces: (u) => `https://codeforces.com/profile/${u}`,
    codechef: (u) => `https://www.codechef.com/users/${u}`,
    atcoder: (u) => `https://atcoder.jp/users/${u}`,
    gfg: (u) => `https://www.geeksforgeeks.org/user/${u}/`,
    hackerrank: (u) => `https://www.hackerrank.com/profile/${u}`,
    naukri: (u) => `https://www.naukri.com/code360/profile/${u}`,
};
const buildPlatformEntry = (platformKey, username) => {
    if (!hasUsername(username)) {
        return {
            connected: false,
        };
    }

    return {
        connected: true,
        username,
        profileUrl: PROFILE_URL[platformKey](username),
    };
};

export const getDashboardData = async (user = {}, forceRefresh = false) => {
    console.log("GET DASHBOARD DATA START, forceRefresh:", forceRefresh);

    const { codingProfiles = {} } = user;

    const {
        leetcode,
        codeforces,
        codechef,
        atcoder,
        gfg,
        hackerrank,
        naukri,
    } = codingProfiles;

    console.log("USER PROFILES:", {
        leetcode,
        codeforces,
        codechef,
        atcoder,
        gfg,
        hackerrank,
        naukri,
    });

    console.log("HAS USERNAME:", {
        leetcode: hasUsername(leetcode),
        codeforces: hasUsername(codeforces),
        codechef: hasUsername(codechef),
        atcoder: hasUsername(atcoder),
        gfg: hasUsername(gfg),
        hackerrank: hasUsername(hackerrank),
        naukri: hasUsername(naukri),
    });

    console.time("PLATFORM CALLS");

    const [
        leetcodeResult,
        codeforcesResult,
        codechefResult,
        atcoderResult,
        gfgResult,
        hackerrankResult,
        naukriResult,
    ] = await Promise.allSettled([
        hasUsername(leetcode)
            ? LeetcodeData(leetcode, forceRefresh)
            : Promise.resolve(EMPTY_LEETCODE),

        hasUsername(codeforces)
            ? getCodeforcesData(codeforces, forceRefresh)
            : Promise.resolve(EMPTY_CODEFORCES),

        hasUsername(codechef)
            ? getCodechefData(codechef, forceRefresh)
            : Promise.resolve(EMPTY_CODECHEF),

        hasUsername(atcoder)
            ? getAtcoderData(atcoder, forceRefresh)
            : Promise.resolve(EMPTY_ATCODER),

        hasUsername(gfg)
            ? getGfgData(gfg, forceRefresh)
            : Promise.resolve(EMPTY_GFG),

        hasUsername(hackerrank)
            ? getHackerrankData(hackerrank, forceRefresh)
            : Promise.resolve(EMPTY_HACKERRANK),

        hasUsername(naukri)
            ? getNaukriData(naukri, forceRefresh)
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

    const codechefData =
        codechefResult.status === "fulfilled"
            ? codechefResult.value
            : EMPTY_CODECHEF;

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
        codechefResult,
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

function toMs(v) {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number" || /^\d+(\.\d+)?$/.test(String(v))) {
        const n = Number(v);
        return n < 1e12 ? n * 1000 : n;
    }
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
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
    // CODECHEF DATES
    // ----------------------------------------

    if (codechefData.contest?.history && Array.isArray(codechefData.contest.history)) {
        for (const c of codechefData.contest.history) {
            const time = c.startTime || c.date || c.endTime;
            if (time) {
                const dateMs = toMs(time);
                if (dateMs) {
                    const date = new Date(dateMs).toISOString().split("T")[0];
                    if (date && date !== "1970-01-01") {
                        activeDays.add(date);
                        activeDaysCounts[date] = (activeDaysCounts[date] || 0) + 1;
                    }
                }
            }
        }
    }

    // ----------------------------------------
    // HACKERRANK DATES
    // ----------------------------------------

    if (hackerrankData.contest?.history && Array.isArray(hackerrankData.contest.history)) {
        for (const c of hackerrankData.contest.history) {
            const time = c.startTime || c.epoch_starttime || c.endTime;
            if (time) {
                const dateMs = toMs(time);
                if (dateMs) {
                    const date = new Date(dateMs).toISOString().split("T")[0];
                    if (date && date !== "1970-01-01") {
                        activeDays.add(date);
                        activeDaysCounts[date] = (activeDaysCounts[date] || 0) + 1;
                    }
                }
            }
        }
    }

    // ----------------------------------------
    // ATCODER DATES
    // ----------------------------------------

    if (atcoderData.contest?.history && Array.isArray(atcoderData.contest.history)) {
        for (const c of atcoderData.contest.history) {
            const time = c.startTime || c.EndTime || c.date;
            if (time) {
                const dateMs = toMs(time);
                if (dateMs) {
                    const date = new Date(dateMs).toISOString().split("T")[0];
                    if (date && date !== "1970-01-01") {
                        activeDays.add(date);
                        activeDaysCounts[date] = (activeDaysCounts[date] || 0) + 1;
                    }
                }
            }
        }
    }

    // ----------------------------------------
    // CODE360 / NAUKRI STREAK DATES
    // ----------------------------------------

    if (naukriData.streak && naukriData.streak > 0) {
        const today = new Date();
        for (let i = 0; i < naukriData.streak; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            activeDays.add(dateStr);
            activeDaysCounts[dateStr] = (activeDaysCounts[dateStr] || 0) + 1;
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
        // CODECHEF
        // ========================================

        codechefSolved:
            codechefData.solved ?? 0,

        codechefRating:
            codechefData.rating ?? 0,

        codechefMaxRating:
            codechefData.maxRating ?? 0,

        codechefStars:
            codechefData.stars ?? "unrated",

        codechefGlobalRank:
            codechefData.globalRank ?? null,

        codechefCountryRank:
            codechefData.countryRank ?? null,

        codechefRatingHistory:
            codechefData.contest?.history ?? [],

        // ========================================
        // ATCODER
        // ========================================

        atcoderSolved:
            atcoderData.accepted_count ?? 0,

        atcoderRating:
            atcoderData.rating ?? 0,

        atcoderMaxRating:
            atcoderData.maxRating ?? 0,

        atcoderRatingHistory:
            atcoderData.contest?.history ?? [],

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

        leetcodeBadges:
            leetcodeData.badges ?? [],

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
        // ALL BADGES & ACHIEVEMENTS
        // ========================================

        allBadges: [
          // 1. LEETCODE
          ...(leetcodeData.badges ?? []).map((b) => ({
            name: b.name || b.displayName,
            icon: b.icon,
            category: b.category || "LeetCode",
            platform: "LeetCode",
          })),

          // 2. HACKERRANK
          ...(hackerrankData.badges ?? []).map((b) => ({
            name: b.badge_name || b.name || "HackerRank Badge",
            icon: b.icon || null,
            stars: b.stars || 0,
            category: b.category_name || "HackerRank",
            platform: "HackerRank",
          })),

          // 3. CODECHEF STAR BADGE
          ...(codechefData.rating > 0 ? [{
            name: `${codechefData.stars} (${codechefData.rating} Rating)`,
            icon: null,
            stars: codechefData.stars,
            category: "CodeChef Rank",
            platform: "CodeChef",
          }] : []),

          // 4. CODEFORCES RANK BADGE
          ...(cfInfo.rank && cfInfo.rank !== "unrated" ? [{
            name: `${cfInfo.rank.toUpperCase()} (${cfInfo.rating} Rating)`,
            icon: null,
            category: "Codeforces Rank",
            platform: "CodeForces",
          }] : []),

          // 5. GFG SOLVED BADGE
          ...(gfgData.solved?.totalSolved > 0 ? [{
            name: `GFG ${gfgData.solved.totalSolved}+ Solved`,
            icon: null,
            category: "GFG Achievement",
            platform: "GeeksforGeeks",
          }] : []),

          // 6. CODE360 / NAUKRI SOLVED BADGE
          ...(naukriData.solved?.totalSolved > 0 ? [{
            name: `Code360 ${naukriData.solved.totalSolved}+ Solved`,
            icon: null,
            category: "Code360 Achievement",
            platform: "Code360",
          }] : []),

          // 7. ATCODER BADGE
          ...(atcoderData.accepted_count > 0 || atcoderData.rating > 0 ? [{
            name: `AtCoder ${atcoderData.accepted_count || 0} Solved${atcoderData.rating > 0 ? ` (${atcoderData.rating} Rating)` : ""}`,
            icon: null,
            category: "AtCoder Achievement",
            platform: "AtCoder",
          }] : []),
        ],

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
            (codechefData.solved ?? 0) +
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

            codechef:
                buildPlatformEntry(
                    "codechef",
                    codechef
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