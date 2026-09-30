import { useState, useEffect, useMemo } from "react";

// Expected shape per contest, coming from the backend:
// { id, name, platform, startTime (ms epoch / seconds / ISO), url }
const CONTESTS_API_URL =
  "https://contest-tracker-for-coding-platforms-1.onrender.com/api/v1/users/contests";

// Every platform the app supports, in the order the filter chips appear.
const PLATFORMS = [
  { name: "LeetCode", color: "#ffa116", aliases: ["leetcode", "lc"] },
  { name: "Codeforces", color: "#4f8cff", aliases: ["codeforces", "cf"] },
  { name: "CodeChef", color: "#d9a066", aliases: ["codechef", "cc"] },
  { name: "AtCoder", color: "#8b7cf6", aliases: ["atcoder", "ac"] },
  { name: "GeeksforGeeks", color: "#2fd9a8", aliases: ["geeksforgeeks", "gfg"] },
  { name: "HackerRank", color: "#2ec866", aliases: ["hackerrank", "hr"] },
  { name: "Code360", color: "#ff6b6b", aliases: ["code360", "naukri", "naukricode360", "codingninjas", "codingninjasstudio", "c3"] },
];

const PLATFORM_COLORS = Object.fromEntries(PLATFORMS.map((p) => [p.name, p.color]));

// "codeforces", "CodeForces", "Code Forces", "gfg" -> canonical display name.
// Unknown platforms are kept as sent, so nothing from the backend gets dropped.
function canonicalPlatform(raw) {
  const key = String(raw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = PLATFORMS.find((p) => p.aliases.includes(key));
  return match ? match.name : String(raw || "Other");
}

const colorFor = (platform) => PLATFORM_COLORS[platform] || "#4f8cff";

function formatIndianDateTime(ms) {
  if (!ms) return "Date n/a";
  const date = new Date(ms);
  if (isNaN(date.getTime())) return "Date n/a";

  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const parts = formatter.formatToParts(date);
  let formatted = "";
  for (const part of parts) {
    if (part.type === "dayPeriod") {
      formatted += part.value.toUpperCase();
    } else {
      formatted += part.value;
    }
  }

  return `${formatted} IST`;
}

function formatCountdown(ms) {
  if (ms <= 0) return "started";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

export default function Contests() {
  const [contests, setContests] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [now, setNow] = useState(Date.now());
  const [activeFilter, setActiveFilter] = useState("All");

  const token = () => localStorage.getItem("token") || localStorage.getItem("accessToken");

  const fetchContests = async () => {
    setStatus("loading");
    try {
      const res = await fetch(CONTESTS_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        },
        credentials: "include",
      });
      const rawText = await res.text();
      let json;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error(`Non-JSON response (status ${res.status})`);
      }
      if (!res.ok) throw new Error(json.message || json.detail || `Request failed (${res.status})`);

      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];

      const normalized = list.map((c, i) => ({
        ...c,
        id: c.id ?? `${c.platform}-${c.name}-${i}`,
        platform: canonicalPlatform(c.platform),
        startTime:
          typeof c.startTime === "number"
            ? c.startTime < 1e12
              ? c.startTime * 1000
              : c.startTime
            : new Date(c.startTime).getTime(),
      }));

      setContests(normalized);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong");
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Only upcoming contests (start time in the future), soonest first.
  const sortedContests = useMemo(
    () => contests.filter((c) => c.startTime > now).sort((a, b) => a.startTime - b.startTime),
    [contests, now]
  );

  const nextContest = sortedContests[0];

  // All supported platforms always get a chip, plus any extra name the backend sends.
  const chips = useMemo(() => {
    const counts = {};
    sortedContests.forEach((c) => {
      counts[c.platform] = (counts[c.platform] || 0) + 1;
    });
    const known = PLATFORMS.map((p) => p.name);
    const extra = Object.keys(counts).filter((n) => !known.includes(n));
    return [
      { name: "All", count: sortedContests.length },
      ...[...known, ...extra].map((n) => ({ name: n, count: counts[n] || 0 })),
    ];
  }, [sortedContests]);

  const filteredContests = useMemo(
    () =>
      activeFilter === "All"
        ? sortedContests
        : sortedContests.filter((c) => c.platform === activeFilter),
    [sortedContests, activeFilter]
  );

  if (status === "loading") {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-center font-sans text-[#8a90a6]">
        loading upcoming contests…
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-center font-sans">
        <p className="text-[#ff5c5c] mb-4">couldn't load contests: {errorMsg}</p>
        <button
          onClick={fetchContests}
          className="text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 pb-16 font-sans text-[#e6e8ef]">
      <section className="bg-[#131720] border border-[#232838] rounded-2xl px-8 py-9 text-center">
        <span className="inline-block font-mono text-xs tracking-widest uppercase text-[#4f8cff] mb-3">
          next up
        </span>
        {nextContest ? (
          <>
            <h1 className="text-2xl font-bold text-[#f2f4f8] mb-2">{nextContest.name}</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-[#8a90a6] mb-5">
              <span className="font-semibold" style={{ color: colorFor(nextContest.platform) }}>
                {nextContest.platform}
              </span>
              <span className="w-[3px] h-[3px] rounded-full bg-[#545b70]" aria-hidden="true" />
              <span>{formatIndianDateTime(nextContest.startTime)}</span>
            </div>
            <div className="font-mono text-5xl font-semibold tracking-tight text-[#4f8cff] mb-5 tabular-nums">
              {formatCountdown(nextContest.startTime - now)}
            </div>
            <a
              href={nextContest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Open contest &rarr;
            </a>
          </>
        ) : (
          <h1 className="text-2xl font-bold text-[#f2f4f8]">No upcoming contests tracked yet</h1>
        )}
      </section>

      {/* One chip per platform, with how many contests each has */}
      <div className="flex flex-wrap gap-2 mt-7 mb-5">
        {chips.map(({ name, count }) => {
          const isActive = activeFilter === name;
          const color = name === "All" ? "#4f8cff" : colorFor(name);
          return (
            <button
              key={name}
              onClick={() => setActiveFilter(name)}
              className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-full border transition-colors"
              style={{
                color: isActive ? color : "#8a90a6",
                borderColor: isActive ? color : "#232838",
                background: "#131720",
              }}
            >
              {name}
              <span
                className="font-mono text-[11px] px-1.5 rounded-full"
                style={{ background: isActive ? `${color}22` : "#ffffff0d" }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <section className="flex flex-col gap-2.5 mt-5">
        {filteredContests.map((contest) => (
          <a
            key={contest.id}
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#131720] border border-[#232838] rounded-xl px-4 py-3.5 hover:border-[#4f8cff] hover:-translate-y-px transition-all"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: colorFor(contest.platform) }}
              aria-hidden="true"
            />
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-sm font-semibold text-[#e6e8ef] truncate">{contest.name}</span>
              <span className="text-xs text-[#8a90a6]">
                <span style={{ color: colorFor(contest.platform) }}>{contest.platform}</span>
                {" · "}
                {formatIndianDateTime(contest.startTime)}
              </span>
            </div>
            <span className="font-mono text-sm text-[#4f8cff] tabular-nums whitespace-nowrap">
              {formatCountdown(contest.startTime - now)}
            </span>
          </a>
        ))}
        {filteredContests.length === 0 && (
          <p className="text-center text-sm text-[#8a90a6] py-8">
            {activeFilter === "All"
              ? "No contests tracked yet."
              : `No upcoming ${activeFilter} contests right now.`}
          </p>
        )}
      </section>
    </main>
  );
}