import redis from "../config/redis.js";
export const getGfgData = async (username) => {
    if(!username) return null;
    const key=`profile:gfg:${username}`;
    const cache=await redis.get(key);
    if(cache)
        return JSON.parse(cache);

    const [profileRes, statsRes, ratingRes] = await Promise.all([
        fetch(`https://gfg-stats.tashif.codes/${username}`),
        fetch(`https://gfg-stats.tashif.codes/${username}/stats`),
        fetch(`https://gfg-stats.tashif.codes/${username}/rating`),
    ]);

    if (!profileRes.ok || !statsRes.ok || !ratingRes.ok) {
        throw new Error("GFG user not found or API unavailable");
    }

    const profileJson = await profileRes.json();
    const statsJson = await statsRes.json();
    const ratingJson = await ratingRes.json();
    if (
        profileJson.status !== "success" ||
        statsJson.status !== "success" ||
        ratingJson.status !== "success"
    ) {
        throw new Error("GFG user not found");
    }

    const profileData = profileJson.data;
    const statsData = statsJson.data;
    const ratingData = ratingJson.data;
    // =========================
    // SOLVED
    // =========================

    const easySolved = statsData.byDifficulty?.easy ?? 0;
    const mediumSolved = statsData.byDifficulty?.medium ?? 0;
    const hardSolved = statsData.byDifficulty?.hard ?? 0;

   
    // RATING HISTORY
    const history = ratingData.history ?? [];
    const data={
        solved: {
            easySolved,
            mediumSolved,
            hardSolved,
            totalSolved:
                statsData.totalSolved ??
                easySolved + mediumSolved + hardSolved,
        },

        contest: {
            contestRating:
                ratingData.current ??
                profileData.currentRating ??
                0,

            maxRating:
                ratingData.max ??
                profileData.maxRating ??
                0,

            history,
        },
    };
    await redis.set(key,JSON.stringify(data),"EX",900);
    return data;
};