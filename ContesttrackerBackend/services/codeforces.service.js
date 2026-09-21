import redis from "../config/redis.js";
export const getCodeforcesData = async (handle) => {
    if(!username) return null;
    const key=`profile:codeForces:${username}`;
    const cache=await redis.get(key);
    if(cache)
        return JSON.parse(cache);

    const [info, rating, submissions] = await Promise.all([
        fetch(`https://codeforces.com/api/user.info?handles=${handle}`),
        fetch(`https://codeforces.com/api/user.rating?handle=${handle}`),
        fetch(`https://codeforces.com/api/user.status?handle=${handle}`)
    ]);
    const data = {
        info: await info.json(),
        rating: await rating.json(),
        submissions: await submissions.json(),
    };
    await redis.set(key,JSON.stringify(data),"EX",900);
    return data;
};