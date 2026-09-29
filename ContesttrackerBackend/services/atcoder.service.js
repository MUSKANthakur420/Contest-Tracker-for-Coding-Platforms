import redis from "../config/redis.js";
export const getAtcoderData = async (username, forceRefresh = false) => {
    if(!username) return null;
    const key=`profile:atcoder:${username}`;
    if (!forceRefresh) {
        const cache=await redis.get(key);
        if(cache){
            return JSON.parse(cache);
        }
    }
    const res = await fetch(
        `https://atcoder-api.herokuapp.com/users/${username}`
    );
    if (!res.ok) {
        throw new Error(`AtCoder API error status ${res.status}`);
    }
    const data = await res.json();
    await redis.set(key, JSON.stringify(data), "EX", 900);
    return data;
};