import redis from "../config/redis.js";
export const getAtcoderData = async (username) => {
    if(!username) return null;
    const key=`profile:atcoder:${username}`;
    const cache=await redis.get(key);
    if(cache){
        return JSON.parse(cache);
    }
    const res = await fetch(
        `https://atcoder-api.herokuapp.com/users/${username}`
    );
    await redis.set(key,JSON.stringify(data),"EX",900);
    return await res.json();
};