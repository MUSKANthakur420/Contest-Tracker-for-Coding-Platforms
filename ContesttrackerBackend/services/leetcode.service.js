const GRAPHQL_URL = "https://leetcode.com/graphql";
const QUERY = `
  query userDashboardData($username: String!) {
    matchedUser(username: $username) {
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      userCalendar {
        activeYears
        streak
        totalActiveDays
        submissionCalendar
      }
    }
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      totalParticipants
      topPercentage
    }
    userContestRankingHistory(username: $username) {
      attended
      trendDirection
      problemsSolved
      totalProblems
      rating
      ranking
      contest {
        title
        startTime
      }
    }
  }
`;

const pickCount = (acSubmissionNum = [], difficulty) =>
  acSubmissionNum.find((d) => d.difficulty === difficulty)?.count ?? 0;

export const LeetcodeData = async (username) => {
  if (!username || !username.trim()) {
    throw new Error(
      "LeetCode username is missing for this user's codingProfiles."
    );
  }

  // Always fetch fresh data from LeetCode.
  // Caching is handled globally through Redis.

  console.log("LEETCODE FETCH START");

  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: `https://leetcode.com/${username}/`,
      Origin: "https://leetcode.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { username },
    }),
  });

  console.log("LEETCODE FETCH END", res.status);

  const raw = await res.text();

  let json;

  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(
      `LeetCode GraphQL returned a non-JSON response (status ${res.status}). ` +
        `LeetCode may be rate-limiting or blocking this request.`
    );
  }

  if (json.errors?.length) {
    throw new Error(`LeetCode GraphQL error: ${json.errors[0].message}`);
  }

  const {
    matchedUser,
    userContestRanking,
    userContestRankingHistory,
  } = json.data;

  if (!matchedUser) {
    throw new Error(`LeetCode user "${username}" not found.`);
  }

  const acSubmissionNum =
    matchedUser.submitStatsGlobal?.acSubmissionNum ?? [];

  const easySolved = pickCount(acSubmissionNum, "Easy");
  const mediumSolved = pickCount(acSubmissionNum, "Medium");
  const hardSolved = pickCount(acSubmissionNum, "Hard");

  const history = (userContestRankingHistory ?? [])
    .filter((c) => c.attended)
    .map((c) => ({
      attended: true,
      rating: c.rating,
      contest: {
        title: c.contest?.title,
        startTime: c.contest?.startTime,
      },
    }));

  const result = {
    solved: {
      easySolved,
      mediumSolved,
      hardSolved,
      solvedProblem: easySolved + mediumSolved + hardSolved,
    },
    contest: {
      contestRating: userContestRanking?.rating ?? 0,
    },
    history,
    calendar: matchedUser.userCalendar ?? null,
  };

  return result;
};