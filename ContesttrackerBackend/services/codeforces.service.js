export const getCodeforcesData = async (handle) => {
    const [info, rating, submissions] = await Promise.all([
        fetch(`https://codeforces.com/api/user.info?handles=${handle}`),
        fetch(`https://codeforces.com/api/user.rating?handle=${handle}`),
        fetch(`https://codeforces.com/api/user.status?handle=${handle}`)
    ]);

    return {
        info: await info.json(),
        rating: await rating.json(),
        submissions: await submissions.json(),
    };
};