import { useState, useEffect, useMemo } from "react";

// Expected shape per contest, coming from the backend now instead of mock data:
// { id, name, platform, startTime (ms epoch), url }
// Mounted inside user.routes.js as router.route("/contests"), under the
// /api/v1/users prefix — so the final path is /api/v1/users/contests.
const CONTESTS_API_URL = "http://localhost:8000/api/v1/users/contests";

const PLATFORM_COLORS = {
  Codeforces: "#ff3d3d",
  LeetCode: "#ffa116",
  CodeChef: "#a25eff",
  AtCoder: "#3f7fbf",
};

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

      // Backend may nest the array under .data or return it directly.
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];

      // Normalize startTime to a ms epoch number regardless of whether the
      // backend sends an ISO string, seconds, or already-ms number.
      const normalized = list.map((c) => ({
        ...c,
        startTime:
          typeof c.startTime === "number"
            ? (c.startTime < 1e12 ? c.startTime * 1000 : c.startTime) // seconds -> ms
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
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchContests();
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const sortedContests = useMemo(
    () => [...contests].sort((a, b) => a.startTime - b.startTime),
    [contests]
  );

  const nextContest = sortedContests[0];

  const platforms = useMemo(
    () => ["All", ...new Set(contests.map((c) => c.platform))],
    [contests]
  );

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
      {/* Hero: next contest countdown is the whole point of this page */}
      <section className="bg-[#131720] border border-[#232838] rounded-2xl px-8 py-9 text-center">
        <span className="inline-block font-mono text-xs tracking-widest uppercase text-[#4f8cff] mb-3">
          next up
        </span>
        {nextContest ? (
          <>
            <h1 className="text-2xl font-bold text-[#f2f4f8] mb-2">{nextContest.name}</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-[#8a90a6] mb-5">
              <span className="font-semibold" style={{ color: PLATFORM_COLORS[nextContest.platform] || "#4f8cff" }}>
                {nextContest.platform}
              </span>
              <span className="w-[3px] h-[3px] rounded-full bg-[#545b70]" aria-hidden="true" />
              <span>{new Date(nextContest.startTime).toLocaleString()}</span>
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

      {/* Filter chips */}
      {contests.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-7 mb-5">
          {platforms.map((platform) => {
            const isActive = activeFilter === platform;
            return (
              <button
                key={platform}
                onClick={() => setActiveFilter(platform)}
                className="text-sm px-4 py-1.5 rounded-full border transition-colors"
                style={{
                  color: isActive ? PLATFORM_COLORS[platform] || "#4f8cff" : "#8a90a6",
                  borderColor: isActive ? PLATFORM_COLORS[platform] || "#4f8cff" : "#232838",
                  background: "#131720",
                }}
              >
                {platform}
              </button>
            );
          })}
        </div>
      )}

      {/* Contest list */}
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
              style={{ background: PLATFORM_COLORS[contest.platform] || "#4f8cff" }}
              aria-hidden="true"
            />
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-sm font-semibold text-[#e6e8ef] truncate">
                {contest.name}
              </span>
              <span className="text-xs text-[#8a90a6]">
                {new Date(contest.startTime).toLocaleString()}
              </span>
            </div>
            <span className="font-mono text-sm text-[#4f8cff] tabular-nums whitespace-nowrap">
              {formatCountdown(contest.startTime - now)}
            </span>
          </a>
        ))}
        {filteredContests.length === 0 && (
          <p className="text-center text-sm text-[#8a90a6] py-8">
            No contests tracked for this platform yet.
          </p>
        )}
      </section>
    </main>
  );
}