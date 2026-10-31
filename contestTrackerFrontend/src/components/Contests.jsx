import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  Clock,
  Check,
  X,
  ExternalLink,
  AlertCircle,
  Calendar,
} from "lucide-react";

const API_BASE = "https://contest-tracker-for-coding-platforms-1.onrender.com/api/v1/users";
const CONTESTS_API_URL = `${API_BASE}/contests`;

// Every platform the app supports, in the order the filter chips appear.
const PLATFORMS = [
  { name: "LeetCode", color: "#ffa116", aliases: ["leetcode", "lc"] },
  { name: "Codeforces", color: "#4f8cff", aliases: ["codeforces", "cf"] },
  { name: "CodeChef", color: "#d9a066", aliases: ["codechef", "cc"] },
  { name: "AtCoder", color: "#8b7cf6", aliases: ["atcoder", "ac"] },
  { name: "GeeksforGeeks", color: "#2fd9a8", aliases: ["geeksforgeeks", "gfg"] },
  { name: "HackerRank", color: "#2ec866", aliases: ["hackerrank", "hr"] },
  {
    name: "Code360",
    color: "#ff6b6b",
    aliases: [
      "code360",
      "naukri",
      "naukricode360",
      "codingninjas",
      "codingninjasstudio",
      "c3",
    ],
  },
];

const PLATFORM_COLORS = Object.fromEntries(PLATFORMS.map((p) => [p.name, p.color]));

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

const REMINDER_OPTIONS = [
  { minutes: 15, label: "15 minutes before", desc: "Quick heads-up" },
  { minutes: 30, label: "30 minutes before", desc: "Recommended for prep", popular: true },
  { minutes: 60, label: "1 hour before", desc: "Plenty of time to warm up" },
];

export default function Contests() {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [now, setNow] = useState(Date.now());
  const [activeFilter, setActiveFilter] = useState("All");

  // User's active reminders map: { [contestId]: { remindBeforeMinutes, remindAt, status } }
  const [myReminders, setMyReminders] = useState({});

  // Reminder modal state
  const [modalContest, setModalContest] = useState(null);
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [reminderActionLoading, setReminderActionLoading] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const token = () => localStorage.getItem("token") || localStorage.getItem("accessToken");
  const isLoggedIn = !!token();

  // Fetch upcoming contests
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

  // Fetch user's registered reminders
  const fetchMyReminders = useCallback(async () => {
    if (!token()) return;
    try {
      const res = await fetch(`${API_BASE}/contests/my-reminders`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
        credentials: "include",
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        const map = {};
        json.data.forEach((r) => {
          map[r.contestId] = r;
        });
        setMyReminders(map);
      }
    } catch (err) {
      console.warn("Could not load user reminders:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchContests();
    fetchMyReminders();
  }, [fetchMyReminders]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Filter only upcoming contests (soonest first)
  const sortedContests = useMemo(
    () => contests.filter((c) => c.startTime > now).sort((a, b) => a.startTime - b.startTime),
    [contests, now]
  );

  const nextContest = sortedContests[0];

  // Platform chips
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

  // Open modal for a contest
  const handleOpenReminderModal = (contest, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const existing = myReminders[contest.id];
    setSelectedMinutes(existing?.remindBeforeMinutes || 30);
    setModalContest(contest);
  };

  // Submit reminder
  const handleSaveReminder = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!modalContest) return;

    setReminderActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/contests/reminder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        credentials: "include",
        body: JSON.stringify({
          contestId: modalContest.id,
          contestName: modalContest.name,
          platform: modalContest.platform,
          contestUrl: modalContest.url,
          startTime: modalContest.startTime,
          remindBeforeMinutes: selectedMinutes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to set reminder");
      }

      setMyReminders((prev) => ({
        ...prev,
        [modalContest.id]: {
          contestId: modalContest.id,
          remindBeforeMinutes: selectedMinutes,
          remindAt: json.data?.remindAt,
        },
      }));

      showToast(`Reminder set for ${modalContest.name}! We'll email you ${selectedMinutes}m before start.`);
      setModalContest(null);
    } catch (err) {
      showToast(err.message || "Failed to set reminder", "error");
    } finally {
      setReminderActionLoading(false);
    }
  };

  // Cancel reminder
  const handleCancelReminder = async () => {
    if (!modalContest) return;

    setReminderActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/contests/reminder/${modalContest.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token()}`,
        },
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Failed to cancel reminder");
      }

      setMyReminders((prev) => {
        const next = { ...prev };
        delete next[modalContest.id];
        return next;
      });

      showToast(`Reminder removed for ${modalContest.name}`, "info");
      setModalContest(null);
    } catch (err) {
      showToast(err.message || "Failed to cancel reminder", "error");
    } finally {
      setReminderActionLoading(false);
    }
  };

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
          className="text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          Retry
        </button>
      </main>
    );
  }

  const nextContestReminded = nextContest ? myReminders[nextContest.id] : null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 pb-16 font-sans text-[#e6e8ef]">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-bounce"
          style={{
            background: toast.type === "error" ? "#221115" : "#0d131f",
            borderColor: toast.type === "error" ? "#ff5c5c" : "#2fd9a8",
            color: toast.type === "error" ? "#ff8585" : "#e6e8ef",
          }}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} className="text-[#ff5c5c]" />
          ) : (
            <Check size={18} className="text-[#2fd9a8]" />
          )}
          <span className="text-sm font-medium">{toast.msg}</span>
          <button
            onClick={() => setToast(null)}
            className="text-[#8a90a6] hover:text-[#e6e8ef] ml-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hero: Next Up Contest */}
      <section className="bg-[#131720] border border-[#232838] rounded-2xl px-8 py-9 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#4f8cff] to-transparent opacity-50" />
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
            <div className="font-mono text-5xl font-semibold tracking-tight text-[#4f8cff] mb-6 tabular-nums">
              {formatCountdown(nextContest.startTime - now)}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={nextContest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                <span>Open contest</span>
                <ExternalLink size={14} />
              </a>
              <button
                onClick={(e) => handleOpenReminderModal(nextContest, e)}
                className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg border transition-all cursor-pointer ${
                  nextContestReminded
                    ? "bg-[#2fd9a818] border-[#2fd9a8] text-[#2fd9a8] hover:bg-[#2fd9a828]"
                    : "bg-[#181d28] border-[#2b3245] text-[#e6e8ef] hover:border-[#4f8cff] hover:text-[#4f8cff]"
                }`}
              >
                {nextContestReminded ? (
                  <>
                    <BellRing size={15} className="animate-pulse" />
                    <span>Reminded ({nextContestReminded.remindBeforeMinutes}m)</span>
                  </>
                ) : (
                  <>
                    <Bell size={15} />
                    <span>Remind Me</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <h1 className="text-2xl font-bold text-[#f2f4f8]">No upcoming contests tracked yet</h1>
        )}
      </section>

      {/* Platform Chips */}
      <div className="flex flex-wrap gap-2 mt-7 mb-5">
        {chips.map(({ name, count }) => {
          const isActive = activeFilter === name;
          const color = name === "All" ? "#4f8cff" : colorFor(name);
          return (
            <button
              key={name}
              onClick={() => setActiveFilter(name)}
              className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-full border transition-colors cursor-pointer"
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

      {/* Contests List */}
      <section className="flex flex-col gap-2.5 mt-5">
        {filteredContests.map((contest) => {
          const reminded = myReminders[contest.id];
          return (
            <div
              key={contest.id}
              className="group flex items-center justify-between gap-3 bg-[#131720] border border-[#232838] rounded-xl px-4 py-3.5 hover:border-[#4f8cff55] transition-all"
            >
              <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: colorFor(contest.platform) }}
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-[#e6e8ef] truncate group-hover:text-[#4f8cff] transition-colors">
                      {contest.name}
                    </span>
                    <ExternalLink size={12} className="text-[#545b70] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs text-[#8a90a6]">
                    <span style={{ color: colorFor(contest.platform) }}>{contest.platform}</span>
                    {" · "}
                    {formatIndianDateTime(contest.startTime)}
                  </span>
                </div>
              </a>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-mono text-sm text-[#4f8cff] tabular-nums whitespace-nowrap">
                  {formatCountdown(contest.startTime - now)}
                </span>

                {/* Reminder button */}
                <button
                  onClick={(e) => handleOpenReminderModal(contest, e)}
                  title={
                    reminded
                      ? `Reminder set for ${reminded.remindBeforeMinutes}m before. Click to edit or cancel.`
                      : "Remind me before contest starts"
                  }
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    reminded
                      ? "bg-[#2fd9a815] border-[#2fd9a844] text-[#2fd9a8] hover:bg-[#2fd9a825]"
                      : "bg-[#181d28] border-[#232838] text-[#8a90a6] hover:text-[#e6e8ef] hover:border-[#4f8cff]"
                  }`}
                >
                  {reminded ? (
                    <>
                      <BellRing size={13} className="text-[#2fd9a8]" />
                      <span>{reminded.remindBeforeMinutes}m</span>
                    </>
                  ) : (
                    <>
                      <Bell size={13} />
                      <span className="hidden sm:inline">Remind</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {filteredContests.length === 0 && (
          <p className="text-center text-sm text-[#8a90a6] py-8">
            {activeFilter === "All"
              ? "No contests tracked yet."
              : `No upcoming ${activeFilter} contests right now.`}
          </p>
        )}
      </section>

      {/* Reminder Config Modal */}
      {modalContest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setModalContest(null)}
        >
          <div
            className="bg-[#131720] border border-[#232838] rounded-2xl max-w-md w-full p-6 text-left shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setModalContest(null)}
              className="absolute top-5 right-5 text-[#8a90a6] hover:text-[#e6e8ef] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  background: `${colorFor(modalContest.platform)}20`,
                  color: colorFor(modalContest.platform),
                }}
              >
                {modalContest.platform}
              </span>
              <span className="text-xs text-[#8a90a6] flex items-center gap-1">
                <Calendar size={12} />
                {formatIndianDateTime(modalContest.startTime)}
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#f2f4f8] mb-1 leading-snug">
              {modalContest.name}
            </h3>

            {!isLoggedIn ? (
              <div className="my-6 p-4 rounded-xl bg-[#181d28] border border-[#2b3245] text-center">
                <Bell size={28} className="text-[#4f8cff] mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-semibold text-[#f2f4f8] mb-1">
                  Log in to get Contest Reminders
                </h4>
                <p className="text-xs text-[#8a90a6] mb-4">
                  We'll send an email alert before the contest begins so you never miss a round.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full text-xs font-semibold py-2.5 rounded-lg bg-[#4f8cff] text-[#0b0e14] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Log In to Continue &rarr;
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#8a90a6] mt-2 mb-4">
                  Select when you want to receive an email reminder before this contest kicks off:
                </p>

                {/* Timing Options */}
                <div className="flex flex-col gap-2 mb-5">
                  {REMINDER_OPTIONS.map((opt) => {
                    const isSelected = selectedMinutes === opt.minutes;
                    return (
                      <button
                        key={opt.minutes}
                        type="button"
                        onClick={() => setSelectedMinutes(opt.minutes)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#4f8cff12] border-[#4f8cff] text-[#e6e8ef]"
                            : "bg-[#0d1017] border-[#1f2433] text-[#8a90a6] hover:border-[#2b3245]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-[#4f8cff] bg-[#4f8cff]" : "border-[#545b70]"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#0b0e14]" />}
                          </div>
                          <div>
                            <span className="text-sm font-semibold block text-[#f2f4f8]">
                              {opt.label}
                            </span>
                            <span className="text-xs text-[#8a90a6]">{opt.desc}</span>
                          </div>
                        </div>

                        {opt.popular && (
                          <span className="text-[10px] font-semibold text-[#4f8cff] bg-[#4f8cff18] px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Popular
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#8a90a6] mb-6 bg-[#0d1017] px-3 py-2 rounded-lg border border-[#1f2433]">
                  <Clock size={14} className="text-[#4f8cff] flex-shrink-0" />
                  <span>
                    Reminder will be delivered straight to your registered email address.
                  </span>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveReminder}
                    disabled={reminderActionLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] py-2.5 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                  >
                    {reminderActionLoading ? (
                      <span>Saving…</span>
                    ) : (
                      <>
                        <Bell size={14} />
                        <span>
                          {myReminders[modalContest.id] ? "Update Reminder" : "Set Reminder"}
                        </span>
                      </>
                    )}
                  </button>

                  {myReminders[modalContest.id] && (
                    <button
                      onClick={handleCancelReminder}
                      disabled={reminderActionLoading}
                      className="text-sm font-semibold text-[#ff5c5c] bg-[#ff5c5c14] border border-[#ff5c5c33] py-2.5 px-4 rounded-lg hover:bg-[#ff5c5c22] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
