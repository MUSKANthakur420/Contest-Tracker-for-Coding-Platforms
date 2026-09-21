import redis from "../config/redis.js";
const CODE360_API =
    "https://www.naukri.com/code360/api/v3/public_section/profile/user_details";

const HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/124.0 Safari/537.36",

    Accept: "application/json",
};

export const getNaukriData = async (profileId) => {
    if (!profileId || !profileId.trim()) {
        throw new Error("Code360 profile ID is missing.");
    }
    const key = `profile:naukri:${profileId.trim()}`;
    const cache=await redis.get(key)
    if(cache) return JSON.parse(cache);
    console.log("CODE360 API FETCH START");

    const url = new URL(CODE360_API);

    url.searchParams.set("uuid", profileId.trim());
    url.searchParams.set("app_context", "publicsection");

    const res = await fetch(url.toString(), {
        method: "GET",
        headers: HEADERS,
    });

    console.log("CODE360 API FETCH END", res.status);

    if (res.status === 404) {
        throw new Error(`Code360 profile "${profileId}" not found.`);
    }

    if (!res.ok) {
        throw new Error(
            `Code360 API request failed with status ${res.status}`
        );
    }

    const json = await res.json();

    if (json?.status !== 200 || json?.error) {
        throw new Error(
            json?.message || "Code360 API returned an error."
        );
    }

    // -----------------------------------
    // DSA PROBLEM COUNT DATA
    // -----------------------------------

    const problemCountData =
        json?.data?.dsa_domain_data?.problem_count_data;

    if (!problemCountData) {
        throw new Error(
            "Code360 DSA problem count data not found."
        );
    }

    const difficultyData =
        problemCountData?.difficulty_data ?? [];

    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    for (const item of difficultyData) {
        const level = item?.level;
        const count = Number(item?.count ?? 0);

        if (level === "Easy") {
            easySolved = count;
        } 
        else if (level === "Moderate") {
            mediumSolved = count;
        } 
        else if (level === "Hard") {
            hardSolved = count;
        }
    }

    const totalSolved = Number(
        problemCountData?.total_count ??
        easySolved + mediumSolved + hardSolved
    );

    // -----------------------------------
    // OTHER PROFILE DATA
    // -----------------------------------

    const rank =
        json?.data?.currentRank ??
        json?.data?.rank ??
        null;

    const streak =
        json?.data?.currentStreak ??
        json?.data?.streak ??
        0;

    // -----------------------------------
    // FINAL RESPONSE
    // -----------------------------------
const data={
    profileId: profileId.trim(),

    solved: {
        easySolved,
        mediumSolved,
        hardSolved,
        totalSolved,
    },

    rank,
    streak,
};
await redis.set(key,JSON.stringify(data),"EX",900);
    return data;
};