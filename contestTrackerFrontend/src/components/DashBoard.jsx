import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  memo,
  startTransition,
} from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  CheckCircle2,
  MapPin,
  GraduationCap,
  ExternalLink,
  Settings,
  Flame,
  Trophy,
  Crown,
  RefreshCw,
} from "lucide-react";

const API_BASE =
  "https://contest-tracker-for-coding-platforms-1.onrender.com/api/v1/users";
const API_URL = `${API_BASE}/dashboard`;

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');`;

const PLATFORM_META = {
  leetcode: { label: "LeetCode", color: "#FFA116", mono: "LC" },
  gfg: { label: "GeeksforGeeks", color: "#2FD9A8", mono: "GFG" },
  codeforces: { label: "CodeForces", color: "#3F8FE0", mono: "CF" },
  atcoder: { label: "AtCoder", color: "#8B7CF6", mono: "AC" },
  hackerrank: { label: "HackerRank", color: "#2EC866", mono: "HR" },
  naukri: { label: "Code360", color: "#FF6B6B", mono: "C3" },
};

const DIFFICULTY_META = {
  easy: { label: "Easy", color: "#2FD9A8" },
  medium: { label: "Medium", color: "#F7B84B" },
  hard: { label: "Hard", color: "#FF5C5C" },
};

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY_LIST = [];
const EMPTY_OBJ = {};

/* ---- refresh limits ---- */
const REFRESH_COOLDOWN_MS = 10 * 60 * 1000; // use 5 * 60 * 1000 for 5 minutes
const COOLDOWN_KEY = "ct_refresh_available_at";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

const DATE_SHORT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

const DATE_FULL = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_FULL_UTC = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* =========================================================
   RATING CONFIG
   ONLY THESE 4 PLATFORMS HAVE RATINGS
========================================================= */

const RATING_PLATFORMS = ["leetcode", "codeforces", "gfg", "hackerrank"];

const RATING_SOURCE = {
  leetcode: {
    rating: (d) => d.leetcodeRating,
    history: (d) => d.leetcodeHistory,
  },
  codeforces: {
    rating: (d) => d.codeforcesRating,
    history: (d) => d.codeforcesRatingHistory,
  },
  gfg: {
    rating: (d) => d.gfgRating,
    history: (d) => d.gfgRatingHistory ?? d.gfgHistory,
  },
  hackerrank: {
    rating: (d) => d.hackerrankRating,
    history: (d) => d.hackerrankRatingHistory ?? d.hackerrankHistory,
  },
};

/* =========================================================
   DATE / NUMBER HELPERS
========================================================= */

function toMs(v) {
  if (v === null || v === undefined || v === "") return null;

  if (typeof v === "number" || /^\d+(\.\d+)?$/.test(String(v))) {
    const n = Number(v);
    return n < 1e12 ? n * 1000 : n;
  }

  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

function toNumOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pick(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

/* =========================================================
   REFRESH COOLDOWN HELPERS
========================================================= */

function readStoredNumber(key) {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function writeStoredNumber(key, value) {
  try {
    if (value) localStorage.setItem(key, String(value));
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

function formatCountdown(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = String(total % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

function useRefreshCooldown(userKey) {
  const storageKey = `${COOLDOWN_KEY}:${userKey || "anon"}`;
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Load saved cooldown (and migrate one started before the username was known)
  useEffect(() => {
    let saved = readStoredNumber(storageKey);

    if (!saved && userKey) {
      const anonKey = `${COOLDOWN_KEY}:anon`;
      const anon = readStoredNumber(anonKey);

      if (anon > Date.now()) {
        saved = anon;
        writeStoredNumber(storageKey, anon);
      }
      writeStoredNumber(anonKey, 0);
    }

    setUntil(saved > Date.now() ? saved : 0);
    setNow(Date.now());
  }, [storageKey, userKey]);

  // Tick once per second while a cooldown is active
  useEffect(() => {
    if (until <= Date.now()) return undefined;

    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= until) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [until]);

  const start = useCallback(
    (ms = REFRESH_COOLDOWN_MS) => {
      const end = Date.now() + ms;
      writeStoredNumber(storageKey, end);
      setUntil(end);
      setNow(Date.now());
    },
    [storageKey]
  );

  const clear = useCallback(() => {
    writeStoredNumber(storageKey, 0);
    setUntil(0);
  }, [storageKey]);

  return { remainingMs: Math.max(0, until - now), start, clear };
}

/* =========================================================
   NORMALIZE CONTEST HISTORY
========================================================= */

function normalizeHistory(list) {
  if (!Array.isArray(list)) return [];

  const rows = list.map((c, i) => {
    const rawTitle =
      c?.contest?.title ??
      pick(c, ["contestName", "ContestName", "contest_name", "title", "name", "contest"]);

    return {
      id: String(i),

      time: toMs(
        c?.contest?.startTime ??
          pick(c, [
            "ratingUpdateTimeSeconds",
            "EndTime",
            "endTime",
            "startTime",
            "date",
            "time",
            "timestamp",
          ])
      ),

      title:
        typeof rawTitle === "string" && rawTitle.trim()
          ? rawTitle
          : "Untitled contest",

      rating: toNumOrNull(
        pick(c, ["rating", "newRating", "NewRating", "currentRating", "value"])
      ),

      oldRating: toNumOrNull(pick(c, ["oldRating", "OldRating"])),

      rank: toNumOrNull(pick(c, ["rank", "ranking", "Place", "place"])),
    };
  });

  rows.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));

  return rows.map((r, i) => {
    const prev = i > 0 ? rows[i - 1].rating : null;
    const base = r.oldRating ?? prev;

    return {
      id: r.id,
      time: r.time,
      title: r.title,
      rating: r.rating,
      rank: r.rank,
      delta: r.rating !== null && base !== null ? r.rating - base : null,
    };
  });
}

/* =========================================================
   USERNAME / URL
========================================================= */

const INVALID_USERNAMES = new Set(["", "undefined", "null", "nan", "none", "n/a"]);

function cleanUsername(value) {
  if (value === null || value === undefined) return "";

  const str = String(value).trim().replace(/^@+/, "").trim();

  return INVALID_USERNAMES.has(str.toLowerCase()) ? "" : str;
}

function cleanUrl(value) {
  if (typeof value !== "string") return null;

  const url = value.trim();

  if (!/^https?:\/\//i.test(url)) return null;
  if (/\/(undefined|null)(\/|\?|#|$)/i.test(url)) return null;

  return url;
}

const PROFILE_URL_BUILDERS = {
  leetcode: (u) => `https://leetcode.com/u/${encodeURIComponent(u)}/`,
  gfg: (u) => `https://www.geeksforgeeks.org/user/${encodeURIComponent(u)}/`,
  codeforces: (u) => `https://codeforces.com/profile/${encodeURIComponent(u)}`,
  atcoder: (u) => `https://atcoder.jp/users/${encodeURIComponent(u)}`,
  hackerrank: (u) => `https://www.hackerrank.com/profile/${encodeURIComponent(u)}`,
  naukri: (u) => `https://www.naukri.com/code360/profile/${encodeURIComponent(u)}`,
};

/* =========================================================
   ANIMATION
========================================================= */

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function useRevealProgress(duration = 1100, resetKey = 0) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setProgress(1);
      return undefined;
    }

    setProgress(0);

    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(easeOutCubic(t));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [resetKey]);

  return progress;
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("leetcode");
  const [avatarExpanded, setAvatarExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    remainingMs,
    start: startCooldown,
    clear: clearCooldown,
  } = useRefreshCooldown(data?.profile?.username);

  const token = () => localStorage.getItem("accessToken") || localStorage.getItem("token");

  /* =========================================================
     FETCH DASHBOARD
  ========================================================= */

  const fetchDashboard = async () => {
    try {
      const res = await fetch(API_URL, {
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

      if (res.status === 404) {
        setErrorMsg(
          json.message || "Dashboard data not available. Please refresh."
        );
        setStatus("empty");
        return;
      }

      if (!res.ok) {
        throw new Error(
          json.message || json.detail || `Request failed (${res.status})`
        );
      }

      startTransition(() => {
        setData(json.data);
        setErrorMsg("");
        setStatus("ready");
      });
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong");
      setStatus("error");
    }
  };

  /* =========================================================
     WAIT FOR REFRESH JOB (polls up to 3 minutes)
  ========================================================= */

  const waitForDashboard = async (jobId) => {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const res = await fetch(`${API_BASE}/dashboard/status/${jobId}`, {
        headers: {
          ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        },
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Failed to check refresh status");
      }

      if (json.status === "completed") {
        await fetchDashboard();
        return;
      }

      if (json.status === "failed") {
        const err = new Error("Dashboard refresh failed. Please try again.");
        err.jobFailed = true;
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(
      "Refresh is still running on the server. Check back in a minute."
    );
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    if (refreshing || remainingMs > 0) return;

    setRefreshing(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        },
        credentials: "include",
      });

      const text = await res.text();

      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Invalid server response");
      }

      // Server-side rate limit (if added): sync the cooldown with it
      if (res.status === 429) {
        const wait = Number(json?.data?.retryAfter) * 1000; // seconds -> ms
        startCooldown(wait > 0 ? wait : REFRESH_COOLDOWN_MS);
        throw new Error(json?.message || "Please wait before refreshing again");
      }

      if (!res.ok) {
        throw new Error(json?.message || "Refresh failed");
      }

      const jobId = json?.data?.jobId;

      if (!jobId) {
        throw new Error("Job ID not received");
      }

      startCooldown(); // job accepted, so the limit starts now
      await waitForDashboard(jobId);
    } catch (err) {
      console.error("Refresh error:", err);

      if (err.jobFailed) clearCooldown(); // let the user retry if the job itself failed

      setErrorMsg(err.message || "Something went wrong while refreshing");
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================================================
     INITIAL FETCH
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!cancelled) {
        await fetchDashboard();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     STREAK
  ========================================================= */

  const activeDaysList = data?.activeDaysList ?? EMPTY_LIST;

  const { maxStreak, currentStreak } = useMemo(
    () => computeStreaks(activeDaysList),
    [activeDaysList]
  );

  /* =========================================================
     PLATFORM ROWS
  ========================================================= */

  const platformRows = useMemo(() => {
    const connected = data?.connectedPlatforms ?? EMPTY_OBJ;

    const solvedFor = {
      leetcode: data?.leetcodeSolved ?? 0,
      gfg: data?.gfgSolved ?? 0,
      codeforces: data?.codeforcesSolved ?? 0,
      atcoder: data?.atcoderSolved ?? 0,
      hackerrank: data?.hackerrankSolved ?? 0,
      naukri: data?.naukriSolved ?? 0,
    };

    return Object.keys(PLATFORM_META).map((key) => {
      const saved = connected[key] ?? {};

      const username = cleanUsername(saved.username);

      const isConnected = Boolean(saved.connected) && username !== "";

      const savedName = [saved.name, saved.label, saved.platformName].find(
        (v) => typeof v === "string" && v.trim() !== ""
      );

      return {
        key,
        ...PLATFORM_META[key],

        label: savedName ? savedName.trim() : PLATFORM_META[key].label,

        connected: isConnected,

        username: isConnected ? username : null,

        url: isConnected
          ? cleanUrl(saved.profileUrl) ??
            PROFILE_URL_BUILDERS[key]?.(username) ??
            null
          : null,

        solved: isConnected ? solvedFor[key] ?? 0 : 0,
      };
    });
  }, [data]);

  const labelFor = useMemo(
    () => Object.fromEntries(platformRows.map((p) => [p.key, p.label])),
    [platformRows]
  );

  /* =========================================================
     REFRESH STATUS STEPS (for the loading animation)
  ========================================================= */

  const refreshSteps = useMemo(() => {
    const names = platformRows
      .filter((p) => p.connected)
      .map((p) => `Fetching ${p.label} stats`);

    return [
      ...(names.length ? names : ["Fetching your stats"]),
      "Syncing contest history",
      "Updating dashboard",
    ];
  }, [platformRows]);

  /* =========================================================
     RATING SERIES
     ONLY 4 PLATFORMS
  ========================================================= */

  const ratingSeries = useMemo(() => {
    const d = data ?? EMPTY_OBJ;
    const out = {};

    RATING_PLATFORMS.forEach((key) => {
      const src = RATING_SOURCE[key];

      const points = normalizeHistory(src.history(d));

      const direct = toNumOrNull(src.rating(d));

      const lastKnown = [...points].reverse().find((p) => p.rating !== null);

      out[key] = {
        points,
        rating: direct ?? lastKnown?.rating ?? null,
      };
    });

    return out;
  }, [data]);

  /* =========================================================
     CONTEST HISTORY
     ONLY 4 RATING PLATFORMS
  ========================================================= */

  const contestHistory = useMemo(
    () =>
      RATING_PLATFORMS.flatMap((key) =>
        ratingSeries[key].points.map((p) => ({
          id: `${key}-${p.id}`,
          platformKey: key,
          title: p.title,
          time: p.time,
          rating: p.rating,
          rank: p.rank,
          delta: p.delta,
        }))
      ).sort((a, b) => (b.time ?? 0) - (a.time ?? 0)),
    [ratingSeries]
  );

  /* =========================================================
     LOADING
  ========================================================= */

  if (status === "loading") {
    return (
      <div style={s.centered}>
        <style>{FONT_IMPORT}</style>
        loading stats…
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (status === "error") {
    return (
      <div style={s.centered}>
        <style>{FONT_IMPORT}</style>

        <span style={{ color: "#FF5C5C" }}>
          couldn't load dashboard: {errorMsg}
        </span>
      </div>
    );
  }

  /* =========================================================
     EMPTY
  ========================================================= */

  if (status === "empty") {
    return (
      <div style={s.centered}>
        <style>{FONT_IMPORT}</style>
        <style>{GLOBAL_CSS}</style>

        <div style={s.emptyStack}>
          <p>{errorMsg}</p>

          <RefreshButton
            refreshing={refreshing}
            remainingMs={remainingMs}
            onClick={handleRefresh}
          />

          {refreshing && <RefreshStatus steps={refreshSteps} />}
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN DATA
  ========================================================= */

  const profile = data?.profile ?? null;
  const awards = data?.awards ?? [];
  const contestRankings = data?.contestRankings ?? [];

  const connectedPlatformRows = platformRows.filter((p) => p.connected);

  const totalContests = contestHistory.length;

  /* =========================================================
     RATING TABS
  ========================================================= */

  const ratingTabs = RATING_PLATFORMS.filter(
    (k) =>
      platformRows.find((p) => p.key === k)?.connected ||
      ratingSeries[k].rating !== null ||
      ratingSeries[k].points.length > 0
  );

  const tabs = ratingTabs.length ? ratingTabs : ["leetcode", "codeforces"];

  const activePlatform = tabs.includes(selectedPlatform)
    ? selectedPlatform
    : tabs[0];

  const activeSeries = ratingSeries[activePlatform];

  const latestContest =
    activeSeries.points.length > 0
      ? activeSeries.points[activeSeries.points.length - 1]
      : null;

  const ratingColor = PLATFORM_META[activePlatform].color;

  /* =========================================================
     DSA RING
  ========================================================= */

  const dsaSegments = [
    {
      key: "easy",
      value: (data.easy ?? 0) + (data.easygfg ?? 0) + (data.easynaukri ?? 0),
    },
    {
      key: "medium",
      value:
        (data.medium ?? 0) + (data.mediumgfg ?? 0) + (data.mediumnaukri ?? 0),
    },
    {
      key: "hard",
      value: (data.hard ?? 0) + (data.hardgfg ?? 0) + (data.hardnaukri ?? 0),
    },
  ].map((seg) => ({ ...seg, ...DIFFICULTY_META[seg.key] }));

  /* =========================================================
     CP RING
  ========================================================= */

  const cpSegments = ["codeforces", "atcoder", "hackerrank"].map((key) => {
    const row = platformRows.find((p) => p.key === key);

    return {
      key,
      ...PLATFORM_META[key],
      label: row?.label ?? PLATFORM_META[key].label,
      value: row?.solved ?? 0,
      notConnected: !row?.connected,
    };
  });

  const totalSolvedAcrossPlatforms = data.totalSolved ?? 0;

  const dsaTotal = dsaSegments.reduce((a, x) => a + x.value, 0);
  const cpTotal = cpSegments.reduce((a, x) => a + x.value, 0);

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <div style={s.wrap}>
      <style>{FONT_IMPORT}</style>
      <style>{GLOBAL_CSS}</style>

      {/* AVATAR MODAL */}

      {avatarExpanded && profile?.avatar && (
        <div
          className="ct-avatar-overlay"
          onClick={() => setAvatarExpanded(false)}
        >
          <img
            src={profile.avatar}
            alt={profile.name}
            style={s.avatarModalImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* =====================================================
          HERO
      ===================================================== */}

      <div className="ct-card ct-hero" style={s.hero}>
        <div style={s.heroGlow} />

        <div style={s.heroLeft}>
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              decoding="async"
              style={{ ...s.heroAvatar, cursor: "pointer" }}
              onClick={() => setAvatarExpanded(true)}
            />
          ) : (
            <div style={{ ...s.heroAvatar, ...s.heroAvatarFallback }}>
              {getInitials(profile?.name ?? profile?.username)}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div style={s.heroName}>
              {profile?.name ?? "Your Profile"}

              {profile?.verified && <CheckCircle2 size={16} color="#2FD9A8" />}
            </div>

            {profile?.username && (
              <div style={s.heroHandle}>@{profile.username}</div>
            )}
          </div>
        </div>

        <div style={s.heroStats}>
          <HeroStat
            label="Total Solved"
            value={totalSolvedAcrossPlatforms || data.totalSolved || 0}
            accent="#2FD9A8"
          />

          <div style={s.heroDivider} />

          <HeroStat label="Contests" value={totalContests} accent="#FFA116" />

          <div style={s.heroDivider} />

          <HeroStat
            label="Streak"
            value={currentStreak}
            accent="#FF8A3D"
            icon={<Flame size={18} color="#FF8A3D" />}
          />

          <div style={s.heroDivider} />

          <Link to="/edit" className="ct-btn" style={s.editProfileBtn}>
            <Settings size={15} />
            Edit Profile
          </Link>

          <RefreshButton
            refreshing={refreshing}
            remainingMs={remainingMs}
            onClick={handleRefresh}
          />

          {errorMsg && <div style={s.refreshError}>{errorMsg}</div>}
        </div>

        {refreshing && (
          <>
            <div style={s.refreshRow}>
              <RefreshStatus steps={refreshSteps} />
            </div>

            <div className="ct-refresh-bar" aria-hidden="true">
              <span />
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          GRID
      ===================================================== */}

      <div className="ct-grid" style={s.threeCol}>
        {/* LEFT */}

        <div style={s.leftCol}>
          {(profile?.location || profile?.institution) && (
            <div className="ct-card" style={s.card}>
              <SectionLabel dot="#3F8FE0">About</SectionLabel>

              <div style={s.metaList}>
                {profile.location && (
                  <div style={s.metaRow}>
                    <MapPin size={15} color="#8A93A6" />
                    <span>{profile.location}</span>
                  </div>
                )}

                {profile.institution && (
                  <div style={s.metaRow}>
                    <GraduationCap size={15} color="#8A93A6" />
                    <span>{profile.institution}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="ct-card" style={{ ...s.card, ...s.cardGrow }}>
            <SectionLabel dot="#2FD9A8">Platforms</SectionLabel>

            {connectedPlatformRows.length === 0 ? (
              <div style={s.emptyPlatformsNote}>
                No platforms connected yet.
                <Link to="/edit" style={s.inlineLink}>
                  Connect one
                </Link>
              </div>
            ) : (
              <div style={s.platformList}>
                {connectedPlatformRows.map((p) => (
                  <PlatformStatRow key={p.key} platform={p} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER */}

        <div style={s.centerCol}>
          <div className="ct-card" style={{ ...s.card, ...s.cardGrow }}>
            <div style={s.ratingHeader}>
              <div>
                <SectionLabel dot={ratingColor}>
                  Rating · {labelFor[activePlatform]}
                </SectionLabel>

                <div style={s.bigNumber}>
                  {activeSeries.rating === null ? (
                    "—"
                  ) : (
                    <CountUpNumber value={Math.round(activeSeries.rating)} />
                  )}
                </div>
              </div>

              {/* ONLY 4 RATING PLATFORMS */}

              <div style={s.platformToggle}>
                {tabs.map((key) => {
                  const r = ratingSeries[key].rating;

                  return (
                    <ToggleChip
                      key={key}
                      label={`${labelFor[key]} ${
                        r === null ? "—" : Math.round(r)
                      }`}
                      color={PLATFORM_META[key].color}
                      active={activePlatform === key}
                      onClick={() => setSelectedPlatform(key)}
                    />
                  );
                })}
              </div>
            </div>

            {latestContest && (
              <div style={s.latestContestRow}>
                <span style={{ color: "#8A93A6" }}>
                  {latestContest.time
                    ? DATE_FULL.format(new Date(latestContest.time))
                    : "Date n/a"}
                </span>

                <span
                  style={{
                    color: "#E6E9EF",
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                  }}
                >
                  {latestContest.title}
                </span>
              </div>
            )}

            <RatingChart
              key={activePlatform}
              points={activeSeries.points}
              color={ratingColor}
            />
          </div>

          {awards.length > 0 && (
            <div className="ct-card" style={s.card}>
              <SectionLabel dot="#F7B84B">Awards · {awards.length}</SectionLabel>

              <div style={s.awardsRow}>
                {awards.map((a) => (
                  <div
                    key={a.id}
                    className="ct-hex"
                    style={s.hexBadge}
                    title={a.label}
                  >
                    <Crown size={20} color="#0A0D12" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}

        <div style={s.rightCol}>
          <div className="ct-card" style={s.card}>
            <SectionLabel dot="#2FD9A8">Problems Solved</SectionLabel>

            <RingBlock
              title="DSA"
              subtitle="LeetCode + GFG + Code360 · by difficulty"
              segments={dsaSegments}
              centerValue={dsaTotal}
              resetKey={`dsa-${dsaTotal}`}
            />

            <RingBlock
              title="Competitive Programming"
              subtitle="CodeForces + AtCoder + HackerRank"
              segments={cpSegments}
              centerValue={cpTotal}
              resetKey={`cp-${cpTotal}`}
              last
            />
          </div>

          {contestRankings.length > 0 && (
            <div className="ct-card" style={s.card}>
              <SectionLabel dot="#8B7CF6">Contest Rankings</SectionLabel>

              {contestRankings.map((r) => (
                <div key={r.platform} style={s.rankRow}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <Trophy size={14} color={r.color ?? "#8A93A6"} />

                    <span style={{ overflowWrap: "anywhere" }}>
                      {r.label ?? r.platform}
                    </span>
                  </span>

                  <span
                    style={{
                      color: "#E6E9EF",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVITY */}

        <div
          className="ct-card ct-below-fold"
          style={{ ...s.card, gridArea: "activity" }}
        >
          <SectionLabel dot="#2FD9A8">Activity</SectionLabel>

          <div style={s.heatStats}>
            <StatInline
              label="Submissions"
              value={activeDaysList.length ? data.totalSolved ?? 0 : 0}
            />

            <StatInline label="Max Streak" value={maxStreak} />

            <StatInline label="Current Streak" value={currentStreak} />
          </div>

          <div style={{ marginTop: 18 }}>
            <Heatmap
              activeDaysList={activeDaysList}
              activeDaysCounts={data?.activeDaysCounts ?? EMPTY_OBJ}
            />
          </div>
        </div>

        {/* CONTEST HISTORY */}

        <ContestHistory items={contestHistory} labels={labelFor} />
      </div>
    </div>
  );
}

/* =========================================================
   REFRESH BUTTON
========================================================= */

function RefreshButton({ refreshing, remainingMs, onClick }) {
  const cooling = remainingMs > 0;

  let label = "Refresh";
  if (refreshing) label = "Refreshing…";
  else if (cooling) label = `Refresh in ${formatCountdown(remainingMs)}`;

  return (
    <button
      onClick={onClick}
      disabled={refreshing || cooling}
      aria-busy={refreshing}
      className={`ct-btn ct-refresh-btn${refreshing ? " is-refreshing" : ""}`}
      style={{
        ...s.refreshBtn,
        ...(refreshing ? { borderColor: "#2FD9A8", color: "#2FD9A8" } : {}),
      }}
      title={
        cooling
          ? `You can refresh once every ${REFRESH_COOLDOWN_MS / 60000} minutes`
          : "Fetch the latest stats from your platforms"
      }
    >
      <RefreshCw size={14} className={refreshing ? "ct-spin" : ""} />
      {label}
    </button>
  );
}

/* =========================================================
   REFRESH STATUS (rotating text)
========================================================= */

function RefreshStatus({ steps }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % steps.length), 1600);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="ct-refresh-status" role="status" aria-live="polite">
      <span key={i} className="ct-refresh-text">
        {steps[i % steps.length]}
      </span>

      <span className="ct-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

/* =========================================================
   SECTION LABEL
========================================================= */

function SectionLabel({ children, dot }) {
  return (
    <div style={s.sectionLabel}>
      <span style={{ ...s.sectionDot, background: dot }} />
      {children}
    </div>
  );
}

/* =========================================================
   COUNT UP
========================================================= */

function CountUpNumber({ value, duration = 900 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;

    if (!el) return undefined;

    const to = Math.round(Number(value) || 0);
    const from = Number(el.textContent) || 0;

    if (from === to || prefersReducedMotion()) {
      el.textContent = String(to);
      return undefined;
    }

    const start = performance.now();
    let raf;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);

      el.textContent = String(
        Math.round(from + (to - from) * easeOutCubic(t))
      );

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span ref={ref}>0</span>;
}

/* =========================================================
   HERO STAT
========================================================= */

function HeroStat({ label, value, accent, icon }) {
  return (
    <div style={s.heroStat}>
      <div style={s.heroStatLabel}>{label}</div>

      <div style={{ ...s.heroStatValue, color: accent }}>
        {icon}
        <CountUpNumber value={value} />
      </div>
    </div>
  );
}

/* =========================================================
   STAT INLINE
========================================================= */

function StatInline({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
      <span style={{ color: "#8A93A6", fontSize: 12.5 }}>{label}</span>

      <span
        style={{
          color: "#E6E9EF",
          fontWeight: 700,
          fontSize: 15,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        <CountUpNumber value={value} />
      </span>
    </div>
  );
}

/* =========================================================
   TOGGLE CHIP
========================================================= */

function ToggleChip({ label, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="ct-chip"
      style={{
        padding: "6px 12px",
        borderRadius: 20,
        cursor: "pointer",
        fontSize: 12.5,
        fontWeight: 600,
        background: active ? `${color}1A` : "transparent",
        border: `1px solid ${active ? color : "#212736"}`,
        color: active ? color : "#8A93A6",
      }}
    >
      {label}
    </button>
  );
}

/* =========================================================
   PLATFORM BADGE
========================================================= */

function PlatformBadge({ mono, color, size = 26 }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `${color}22`,
        border: `1px solid ${color}55`,
        color,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {mono}
    </span>
  );
}

/* =========================================================
   PLATFORM ROW
========================================================= */

function PlatformStatRow({ platform }) {
  return (
    <div className="ct-row" style={s.platformStatRow}>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
          flex: "1 1 auto",
        }}
      >
        <PlatformBadge mono={platform.mono} color={platform.color} />

        <span
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{ ...s.ellipsis, color: "#E6E9EF", fontSize: 13.5 }}
            title={platform.label}
          >
            {platform.label}
          </span>

          {platform.username && (
            <span
              style={{
                ...s.ellipsis,
                color: "#8A93A6",
                fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
              }}
              title={`@${platform.username}`}
            >
              @{platform.username}
            </span>
          )}
        </span>
      </span>

      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: "#8A93A6",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12.5,
          }}
        >
          <CountUpNumber value={platform.solved ?? 0} />
        </span>

        {platform.url && (
          <a
            href={platform.url}
            target="_blank"
            rel="noreferrer"
            style={{ display: "flex" }}
          >
            <ExternalLink size={14} color="#8A93A6" />
          </a>
        )}
      </span>
    </div>
  );
}

/* =========================================================
   LEGEND
========================================================= */

function LegendRow({ label, value, color, notConnected = false }) {
  return (
    <div className="ct-legend-row">
      <span className="ct-legend-name">
        <span className="ct-legend-dot" style={{ background: color }} />

        <span className="ct-legend-label" title={label}>
          {label}
        </span>
      </span>

      {notConnected ? (
        <span className="ct-legend-value is-empty">Not connected</span>
      ) : (
        <span className="ct-legend-value">
          <CountUpNumber value={value} duration={700} />
        </span>
      )}
    </div>
  );
}

/* =========================================================
   RING BLOCK
========================================================= */

function RingBlock({ title, subtitle, segments, centerValue, resetKey, last }) {
  return (
    <div
      className="ct-ringblock"
      style={{
        ...s.ringBlock,
        ...(last
          ? { marginBottom: 0, paddingBottom: 0, borderBottom: "none" }
          : {}),
      }}
    >
      <div style={s.ringBlockTitle}>{title}</div>
      <div style={s.ringBlockSubtitle}>{subtitle}</div>

      <div className="ct-ring-split">
        <Ring segments={segments} centerValue={centerValue} resetKey={resetKey} />

        <div className="ct-legend">
          {segments.map((seg) => (
            <LegendRow
              key={seg.key}
              label={seg.label}
              value={seg.value}
              color={seg.color}
              notConnected={seg.notConnected}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   RING
========================================================= */

function Ring({ segments, centerValue, size = 120, thickness = 13, resetKey }) {
  const progress = useRevealProgress(1100, resetKey);

  const total = segments.reduce((acc, seg) => acc + seg.value, 0);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  const effectiveSegments = total > 0 ? segments : [];

  const centerLen = String(Math.round(Number(centerValue) || 0)).length;

  const centerFont = centerLen > 5 ? 15 : centerLen > 4 ? 18 : 22;

  return (
    <div
      className="ct-ring"
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", overflow: "visible" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#181D27"
          strokeWidth={thickness}
          fill="none"
        />

        {effectiveSegments.map((seg) => {
          const frac = seg.value / total;
          const dash = frac * circumference * progress;
          const gap = circumference - dash;
          const segOffset = offset;

          offset += frac * circumference;

          if (seg.value <= 0 || dash < 0.5) return null;

          return (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={thickness}
              fill="none"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-segOffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#E6E9EF",
            fontSize: centerFont,
            fontWeight: 700,
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          <CountUpNumber value={centerValue} />
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   RATING CHART
========================================================= */

const RatingChart = memo(function RatingChart({ points, color }) {
  const graphData = useMemo(
    () =>
      points
        .filter((p) => p.rating !== null)
        .map((p, i) => ({
          date: p.time ? DATE_SHORT.format(new Date(p.time)) : `#${i + 1}`,
          rating: p.rating,
        })),
    [points]
  );

  if (graphData.length === 0) {
    return <div style={s.emptyNote}>No contest history yet.</div>;
  }

  const showDots = graphData.length <= 60;

  return (
    <div style={s.chartBox}>
      <div style={s.chartInner}>
        <ResponsiveContainer width="100%" height="100%" debounce={80}>
          <AreaChart
            data={graphData}
            margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1B212D" />

            <XAxis
              dataKey="date"
              stroke="#8A93A6"
              fontSize={11}
              interval="preserveStartEnd"
              minTickGap={24}
            />

            <YAxis
              stroke="#8A93A6"
              fontSize={11}
              width={44}
              domain={["auto", "auto"]}
            />

            <Tooltip
              allowEscapeViewBox={{ x: false, y: false }}
              wrapperStyle={{ zIndex: 5, maxWidth: "100%" }}
              contentStyle={{
                background: "#0D1017",
                border: "1px solid #212736",
                fontFamily: "JetBrains Mono, monospace",
                borderRadius: 8,
              }}
              labelStyle={{ color: "#8A93A6" }}
            />

            <Area
              type="monotone"
              dataKey="rating"
              stroke={color}
              strokeWidth={2.75}
              fill="url(#ratingFill)"
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
              dot={
                showDots ? { r: 2.5, fill: color, strokeWidth: 0 } : false
              }
              activeDot={{
                r: 5,
                fill: color,
                stroke: "#0A0D12",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

/* =========================================================
   CONTEST HISTORY
   ONLY 4 RATING PLATFORMS
========================================================= */

const ContestHistory = memo(function ContestHistory({ items, labels }) {
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const map = {};

    items.forEach((c) => {
      map[c.platformKey] = (map[c.platformKey] ?? 0) + 1;
    });

    return map;
  }, [items]);

  const activeFilter = filter === "all" || counts[filter] ? filter : "all";

  const visible = useMemo(
    () =>
      activeFilter === "all"
        ? items
        : items.filter((c) => c.platformKey === activeFilter),
    [items, activeFilter]
  );

  return (
    <div
      className="ct-card ct-below-fold"
      style={{ ...s.card, gridArea: "contests" }}
    >
      <SectionLabel dot="#FFA116">Contests · {items.length}</SectionLabel>

      {items.length === 0 ? (
        <div style={s.emptyNote}>No contest history yet.</div>
      ) : (
        <>
          <div style={s.contestChips}>
            <ToggleChip
              label={`All ${items.length}`}
              color="#2FD9A8"
              active={activeFilter === "all"}
              onClick={() => setFilter("all")}
            />

            {Object.keys(counts).map((key) => (
              <ToggleChip
                key={key}
                label={`${labels[key] ?? PLATFORM_META[key]?.label ?? key} ${
                  counts[key]
                }`}
                color={PLATFORM_META[key]?.color ?? "#8A93A6"}
                active={activeFilter === key}
                onClick={() => setFilter(key)}
              />
            ))}
          </div>

          <div style={s.contestSummary}>
            Showing {visible.length} of {items.length} contests
          </div>

          <div className="ct-contest-list">
            {visible.map((c) => {
              const meta = PLATFORM_META[c.platformKey] ?? {
                mono: "?",
                color: "#8A93A6",
                label: c.platformKey,
              };

              return (
                <div key={c.id} className="ct-contest-item">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <PlatformBadge mono={meta.mono} color={meta.color} size={22} />

                    <span className="ct-contest-platform">
                      {labels[c.platformKey] ?? meta.label}
                    </span>
                  </div>

                  <div className="ct-contest-title">{c.title}</div>

                  <div className="ct-contest-meta">
                    <span>
                      {c.time ? DATE_FULL.format(new Date(c.time)) : "Date n/a"}
                    </span>

                    {c.rating !== null && (
                      <span>Rating {Math.round(c.rating)}</span>
                    )}

                    {c.rank !== null && (
                      <span>Rank {c.rank.toLocaleString("en-US")}</span>
                    )}

                    {c.delta !== null && (
                      <span
                        style={{ color: c.delta >= 0 ? "#2FD9A8" : "#FF5C5C" }}
                      >
                        {c.delta >= 0 ? "+" : ""}
                        {c.delta}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});

/* =========================================================
   INITIALS
========================================================= */

function getInitials(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";

  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

/* =========================================================
   STREAKS
========================================================= */

function computeStreaks(activeDaysList) {
  if (!activeDaysList.length) {
    return { maxStreak: 0, currentStreak: 0 };
  }

  const sorted = [...activeDaysList].sort();

  let maxStreak = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);

    const diffDays = Math.round((cur - prev) / 86400000);

    if (diffDays === 1) {
      run += 1;
    } else if (diffDays > 1) {
      run = 1;
    }

    maxStreak = Math.max(maxStreak, run);
  }

  const activeSet = new Set(sorted);

  let currentStreak = 0;

  const now = new Date();

  const cursor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  while (activeSet.has(cursor.toISOString().split("T")[0])) {
    currentStreak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { maxStreak, currentStreak };
}

/* =========================================================
   HEATMAP
========================================================= */

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const Heatmap = memo(function Heatmap({ activeDaysList, activeDaysCounts }) {
  const tagdaThreshold = useMemo(() => {
    const counts = Object.values(activeDaysCounts).filter((c) => c > 0);

    if (!counts.length) return Infinity;

    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;

    return Math.max(avg * 1.75, 3);
  }, [activeDaysCounts]);

  const { cells, monthLabels, weekCount } = useMemo(() => {
    const activeSet = new Set(activeDaysList);

    const now = new Date();

    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const todayKey = today.toISOString().split("T")[0];

    const start = new Date(today);

    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() - 11);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());

    const cellList = [];
    const weekMonths = [];

    const cursor = new Date(start);

    let weekIndex = 0;

    while (cursor <= today) {
      let weekMonth = null;

      for (let d = 0; d < 7; d++) {
        if (cursor <= today) {
          const key = cursor.toISOString().split("T")[0];

          const active = activeSet.has(key);
          const count = activeDaysCounts[key] ?? 0;
          const hot = active && count >= tagdaThreshold;

          if (weekMonth === null) {
            weekMonth = cursor.getUTCMonth();
          }

          let cls = "ct-heat-cell";

          if (hot) {
            cls += " is-hot";
          } else if (active) {
            cls += " is-active";
          }

          if (key === todayKey) {
            cls += " is-today";
          } else if (cursor.getUTCDate() === 1) {
            cls += " is-first";
          }

          cellList.push({
            id: key,
            col: weekIndex + 2,
            row: d + 2,
            cls,
            hot,
            title: `${
              active ? `Solved${count ? ` (${count})` : ""}` : "No activity"
            } — ${DATE_FULL_UTC.format(cursor)}`,
          });
        }

        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      weekMonths.push(weekMonth);
      weekIndex += 1;
    }

    const rawLabels = [];

    let lastMonth = -1;

    weekMonths.forEach((m, i) => {
      if (m !== null && m !== lastMonth) {
        rawLabels.push({ week: i, month: m });
        lastMonth = m;
      }
    });

    const labels = rawLabels
      .filter((m, idx) => {
        const next = rawLabels[idx + 1];
        return !(next && next.week - m.week < 3);
      })
      .map((m) => ({ week: m.week, label: MONTH_SHORT[m.month] }));

    return { cells: cellList, monthLabels: labels, weekCount: weekIndex };
  }, [activeDaysList, activeDaysCounts, tagdaThreshold]);

  const weekdays = ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div
      className="ct-heat-scroll"
      style={{ overflowX: "auto", maxWidth: "100%" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `28px repeat(${weekCount},14px)`,
          gridTemplateRows: "18px repeat(7,14px)",
          gap: 3,
          minWidth: weekCount * 17,
        }}
      >
        {monthLabels.map((m) => (
          <div
            key={m.week}
            style={{
              gridColumn: `${m.week + 2} / span 3`,
              gridRow: 1,
              whiteSpace: "nowrap",
              color: "#8A93A6",
              fontSize: 11,
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 600,
            }}
          >
            {m.label}
          </div>
        ))}

        {weekdays.map((d, i) => (
          <div
            key={i}
            style={{
              gridColumn: 1,
              gridRow: i + 2,
              color: "#8A93A6",
              fontSize: 10,
              textAlign: "right",
              paddingRight: 4,
            }}
          >
            {d}
          </div>
        ))}

        {cells.map((c) => (
          <div
            key={c.id}
            className={c.cls}
            title={c.title}
            style={{ gridColumn: c.col, gridRow: c.row }}
          >
            {c.hot && (
              <Flame
                size={7}
                color="#0A0D12"
                fill="#0A0D12"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 6,
          marginTop: 12,
          color: "#8A93A6",
          fontSize: 11,
        }}
      >
        <span>Less</span>

        <div
          style={{ width: 12, height: 12, background: "#181D27", borderRadius: 2 }}
        />

        <div
          style={{ width: 12, height: 12, background: "#2FD9A8", borderRadius: 2 }}
        />

        <div
          style={{
            width: 12,
            height: 12,
            background: "#F7B84B",
            borderRadius: 2,
            boxShadow: "0 0 6px #F7B84Bcc",
          }}
        />

        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          More
          <Flame size={11} color="#F7B84B" fill="#F7B84B" />
        </span>
      </div>
    </div>
  );
});

/* =========================================================
   GLOBAL CSS
========================================================= */

const GLOBAL_CSS = `
  .ct-card {
    min-width: 0;
    background: #0D1118;
    border: 1px solid rgba(255,255,255,0.06);
    transition: border-color .22s ease;
  }

  @media (hover: hover) {
    .ct-card:hover {
      border-color: rgba(47,217,168,0.35);
    }

    .ct-row:hover {
      background: rgba(255,255,255,0.03);
    }

    .ct-chip:hover {
      transform: translateY(-1px);
    }

    .ct-btn:hover {
      transform: translateY(-1px);
      border-color: #2FD9A8;
      color: #2FD9A8;
    }

    .ct-ring:hover {
      transform: scale(1.035);
    }

    .ct-hex:hover {
      transform: translateY(-3px) scale(1.05);
      box-shadow: 0 0 16px #F7B84B88;
    }

    .ct-heat-cell:not(.is-none):hover {
      transform: scale(1.35);
    }
  }

  .ct-row {
    transition: background .18s ease;
    border-radius: 8px;
  }

  .ct-chip {
    transition:
      transform .15s ease,
      background .15s ease,
      border-color .15s ease;
  }

  .ct-btn {
    transition:
      transform .15s ease,
      border-color .15s ease,
      background .15s ease;
  }

  .ct-ring {
    transition: transform .25s ease;
  }

  .ct-hex {
    transition:
      transform .2s ease,
      box-shadow .2s ease;
  }

  .ct-below-fold {
    content-visibility: auto;
    contain-intrinsic-size: auto 420px;
  }

  .ct-avatar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.78);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    cursor: zoom-out;
    animation: ct-fade-in .18s ease;
  }

  @keyframes ct-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ---------- refresh button + loading animation ---------- */

  .ct-refresh-btn { cursor: pointer; }
  .ct-refresh-btn:disabled { cursor: not-allowed; opacity: .75; }
  .ct-refresh-btn:disabled:hover { transform: none; border-color: #212736; color: #8A93A6; }
  .ct-refresh-btn.is-refreshing:disabled { opacity: 1; cursor: progress; }
  .ct-refresh-btn.is-refreshing:disabled:hover { border-color: #2FD9A8; color: #2FD9A8; }

  .ct-spin { animation: ct-spin .9s linear infinite; }
  @keyframes ct-spin { to { transform: rotate(360deg); } }

  .ct-refresh-status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #8A93A6;
    font-size: 12px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
  }

  .ct-refresh-text { color: #E6E9EF; animation: ct-text-in .35s ease; }

  @keyframes ct-text-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: none; }
  }

  .ct-dots i {
    display: inline-block;
    width: 4px;
    height: 4px;
    margin-left: 3px;
    border-radius: 50%;
    background: #2FD9A8;
    animation: ct-dot 1.2s infinite ease-in-out;
  }
  .ct-dots i:nth-child(2) { animation-delay: .15s; }
  .ct-dots i:nth-child(3) { animation-delay: .3s; }

  @keyframes ct-dot {
    0%, 80%, 100% { opacity: .25; transform: scale(.7); }
    40% { opacity: 1; transform: scale(1); }
  }

  .ct-refresh-bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 3px;
    background: rgba(47,217,168,.12);
    overflow: hidden;
  }

  .ct-refresh-bar > span {
    display: block;
    width: 35%;
    height: 100%;
    background: linear-gradient(90deg, transparent, #2FD9A8, transparent);
    animation: ct-bar 1.3s ease-in-out infinite;
  }

  @keyframes ct-bar {
    from { transform: translateX(-100%); }
    to { transform: translateX(300%); }
  }

  /* ---------- heatmap ---------- */

  .ct-heat-scroll {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
  }

  .ct-heat-cell {
    position: relative;
    width: 12px;
    height: 12px;
    border-radius: 3px;
    background: #181D27;
    border: 1px solid #212736;
    cursor: pointer;
    transition: transform .12s ease;
  }

  .ct-heat-cell.is-first { border-color: #4B5563; }
  .ct-heat-cell.is-active { background: #2FD9A8; }

  .ct-heat-cell.is-hot {
    background: #F7B84B;
    box-shadow:
      0 0 10px #F7B84Bcc,
      0 0 2px #FFF8;
  }

  .ct-heat-cell.is-today { border: 2px solid white; }

  /* ---------- grid ---------- */

  .ct-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "left"
      "center"
      "right"
      "activity"
      "contests";
  }

  @media (min-width: 768px) {
    .ct-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-areas:
        "left right"
        "center center"
        "activity activity"
        "contests contests";
    }
  }

  @media (min-width: 1100px) {
    .ct-grid {
      grid-template-columns:
        minmax(240px, 280px)
        minmax(0, 1fr)
        minmax(320px, 360px);

      grid-template-areas:
        "left center right"
        "activity activity activity"
        "contests contests contests";
    }
  }

  /* ---------- rings ---------- */

  .ct-ringblock {
    container-type: inline-size;
    min-width: 0;
  }

  .ct-ring-split {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 16px 18px;
    align-items: center;
    margin-top: 14px;
    min-width: 0;
  }

  .ct-ring-split > .ct-ring { justify-self: center; }

  .ct-legend {
    min-width: 0;
    display: grid;
    gap: 6px;
  }

  @container (max-width: 300px) {
    .ct-ring-split { grid-template-columns: minmax(0, 1fr); }
  }

  .ct-legend-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 8px;
    row-gap: 2px;
    min-width: 0;
    padding: 7px 12px;
    background: #0D1017;
    border: 1px solid #1B212D;
    border-radius: 6px;
  }

  .ct-legend-name {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ct-legend-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .ct-legend-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #E6E9EF;
    font-size: 12.5px;
    font-weight: 600;
  }

  .ct-legend-value {
    margin-left: auto;
    flex: 0 0 auto;
    white-space: nowrap;
    text-align: right;
    color: #8A93A6;
    font-size: 12.5px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums;
  }

  .ct-legend-value.is-empty {
    font-size: 11px;
    font-family: 'Space Grotesk', 'Inter', sans-serif;
  }

  /* ---------- contest list ---------- */

  .ct-contest-list {
    display: grid;
    gap: 10px;
    min-width: 0;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    max-height: min(70vh, 640px);
    overflow-y: auto;
    padding-right: 2px;
    overscroll-behavior: auto;
    -webkit-overflow-scrolling: touch;
  }

  .ct-contest-item {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    background: #0D1017;
    border: 1px solid #1B212D;
    border-radius: 10px;
    content-visibility: auto;
    contain-intrinsic-size: auto 112px;
  }

  .ct-contest-platform {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #8A93A6;
    font-size: 11.5px;
  }

  .ct-contest-title {
    color: #E6E9EF;
    font-size: 13.5px;
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .ct-contest-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    color: #8A93A6;
    font-size: 11.5px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums;
  }

  @media (prefers-reduced-motion: reduce) {
    .ct-card,
    .ct-row,
    .ct-chip,
    .ct-btn,
    .ct-ring,
    .ct-hex,
    .ct-heat-cell {
      transition: none !important;
    }

    .ct-avatar-overlay {
      animation: none;
    }

    .ct-spin,
    .ct-dots i,
    .ct-refresh-bar > span,
    .ct-refresh-text {
      animation: none !important;
    }
  }
`;

/* =========================================================
   STYLES
========================================================= */

const FONT_SANS = "'Space Grotesk', 'Inter', sans-serif";

const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

const s = {
  centered: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0A0D12",
    color: "#8A93A6",
    fontFamily: FONT_MONO,
    fontSize: 13,
  },

  emptyStack: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
  },

  wrap: {
    minHeight: "100vh",
    background: "#0A0D12",
    padding: "28px clamp(16px, 3vw, 40px) 48px",
    fontFamily: FONT_SANS,
  },

  hero: {
    position: "relative",
    maxWidth: 1680,
    margin: "0 auto 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    padding: "22px 28px",
    borderRadius: 16,
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "radial-gradient(circle, #2FD9A833 0%, transparent 70%)",
    pointerEvents: "none",
  },

  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    zIndex: 1,
    minWidth: 0,
    flex: "1 1 240px",
  },

  heroAvatar: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #212736",
    flexShrink: 0,
  },

  heroAvatarFallback: {
    background: "#181D27",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#8A93A6",
    fontWeight: 700,
    fontSize: 20,
    fontFamily: FONT_MONO,
  },

  avatarModalImg: {
    maxWidth: "min(80vw, 480px)",
    maxHeight: "80vh",
    borderRadius: 20,
    border: "1px solid #212736",
    boxShadow: "0 0 60px #00000088",
    objectFit: "cover",
    cursor: "default",
  },

  heroName: {
    color: "#E6E9EF",
    fontSize: 20,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  heroHandle: {
    color: "#3F8FE0",
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONT_MONO,
    overflowWrap: "anywhere",
  },

  heroStats: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: "12px 24px",
    zIndex: 1,
    minWidth: 0,
  },

  heroStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 74,
  },

  heroStatLabel: {
    color: "#8A93A6",
    fontSize: 11.5,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  heroStatValue: {
    fontSize: 26,
    fontWeight: 700,
    fontFamily: FONT_MONO,
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },

  heroDivider: {
    width: 1,
    height: 34,
    background: "#212736",
  },

  editProfileBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    borderRadius: 10,
    border: "1px solid #212736",
    background: "#0D1017",
    color: "#8A93A6",
    fontSize: 12.5,
    fontWeight: 600,
    textDecoration: "none",
  },

  refreshBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 14px",
    borderRadius: 10,
    border: "1px solid #212736",
    background: "#0D1017",
    color: "#8A93A6",
    fontSize: 12.5,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums", // stops the countdown from jittering
  },

  refreshRow: {
    flex: "0 0 100%",
    zIndex: 1,
  },

  refreshError: {
    color: "#FF5C5C",
    fontSize: 12,
    maxWidth: 230,
    lineHeight: 1.4,
  },

  threeCol: {
    display: "grid",
    gap: 20,
    maxWidth: 1680,
    margin: "0 auto",
    alignItems: "stretch",
  },

  leftCol: {
    gridArea: "left",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minWidth: 0,
  },

  centerCol: {
    gridArea: "center",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minWidth: 0,
  },

  rightCol: {
    gridArea: "right",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minWidth: 0,
  },

  card: {
    borderRadius: 14,
    padding: "clamp(16px, 1.8vw, 22px)",
    minWidth: 0,
  },

  cardGrow: {
    flex: "1 1 auto",
    display: "flex",
    flexDirection: "column",
  },

  ellipsis: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  sectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#8A93A6",
    fontFamily: FONT_MONO,
    fontSize: 12.5,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },

  bigNumber: {
    color: "#E6E9EF",
    fontFamily: FONT_MONO,
    fontSize: "clamp(30px, 3.2vw, 36px)",
    fontWeight: 700,
    lineHeight: 1.1,
    marginTop: 2,
  },

  emptyNote: {
    color: "#8A93A6",
    fontFamily: FONT_MONO,
    fontSize: 12.5,
    padding: "10px 0",
  },

  emptyPlatformsNote: {
    color: "#8A93A6",
    fontSize: 12.5,
    padding: "8px 0",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  inlineLink: {
    color: "#3F8FE0",
    fontSize: 12.5,
    fontWeight: 600,
    textDecoration: "none",
  },

  metaList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#E6E9EF",
    fontSize: 13,
    overflowWrap: "anywhere",
  },

  platformList: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
  },

  platformStatRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "10px 8px",
    borderBottom: "1px solid #1B212D",
    flex: "1 1 auto",
    minHeight: 52,
    maxHeight: 88,
  },

  ratingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 4,
  },

  platformToggle: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  latestContestRow: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginTop: 12,
    marginBottom: 8,
    fontSize: 12.5,
  },

  chartBox: {
    position: "relative",
    flex: "1 1 auto",
    minHeight: 240,
    width: "100%",
    minWidth: 0,
  },

  chartInner: {
    position: "absolute",
    inset: 0,
  },

  heatStats: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px 24px",
  },

  awardsRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  hexBadge: {
    width: 44,
    height: 44,
    clipPath:
      "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    background: "linear-gradient(160deg, #F7B84B, #FFA116)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 10px #F7B84B44",
  },

  ringBlock: {
    marginBottom: 22,
    paddingBottom: 22,
    borderBottom: "1px solid #1B212D",
  },

  ringBlockTitle: {
    color: "#E6E9EF",
    fontSize: 14.5,
    fontWeight: 700,
  },

  ringBlockSubtitle: {
    color: "#8A93A6",
    fontSize: 11.5,
    fontFamily: FONT_MONO,
    marginTop: 2,
    overflowWrap: "anywhere",
  },

  rankRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    color: "#E6E9EF",
    fontSize: 13,
    padding: "9px 0",
    borderBottom: "1px solid #1B212D",
  },

  contestChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  contestSummary: {
    color: "#8A93A6",
    fontSize: 12,
    margin: "12px 0",
  },
};