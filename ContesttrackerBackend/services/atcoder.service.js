export const getAtcoderData = async (username) => {
    const res = await fetch(
        `https://atcoder-api.herokuapp.com/users/${username}`
    );

    return await res.json();
};