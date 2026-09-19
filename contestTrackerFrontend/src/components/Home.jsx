import React from 'react'
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  What the app tracks                                                */
/*  rating: true  -> rating is synced for this platform                */
/*  Problems solved are counted on EVERY platform in this list.        */
/* ------------------------------------------------------------------ */

const PLATFORMS = [
    { key: 'leetcode', label: 'LeetCode', mono: 'LC', color: '#ffa116', rating: true },
    { key: 'codeforces', label: 'Codeforces', mono: 'CF', color: '#4f8cff', rating: true },
    { key: 'gfg', label: 'GeeksforGeeks', mono: 'GFG', color: '#2fd9a8', rating: true },
    { key: 'hackerrank', label: 'HackerRank', mono: 'HR', color: '#2ec866', rating: true },
    { key: 'atcoder', label: 'AtCoder', mono: 'AC', color: '#8b7cf6', rating: false },
    { key: 'naukri', label: 'Code360', mono: 'C3', color: '#ff6b6b', rating: false },
];

const RATED_COUNT = PLATFORMS.filter((p) => p.rating).length;

const BG = '#0b0e14';
const FONT_SANS = "'Space Grotesk', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

/* one orchestrated moment: the background cards rise in once, the rating line draws itself */
@keyframes ct-rise {
  from { opacity: 0; transform: translateY(28px) rotate(var(--r)); }
  to   { opacity: var(--o, 1); transform: translateY(0) rotate(var(--r)); }
}
@keyframes ct-draw { to { stroke-dashoffset: 0; } }
@keyframes ct-fade { from { opacity: 0; } to { opacity: 1; } }

.ct-art {
  transform: rotate(var(--r));
  opacity: var(--o, 1);
  animation: ct-rise .9s cubic-bezier(.2,.7,.2,1) both;
}
.ct-line {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ct-draw 1.6s .5s cubic-bezier(.4,0,.2,1) forwards;
}
.ct-area { animation: ct-fade 1s 1.4s both; }

@media (prefers-reduced-motion: reduce) {
  .ct-art, .ct-area { animation: none; }
  .ct-line { animation: none; stroke-dashoffset: 0; }
}
`;

/* ------------------------------------------------------------------ */
/*  Background art data (built once, no randomness at render time)     */
/* ------------------------------------------------------------------ */

// Codeforces-style rating graph: coloured rank bands + a rising line
const CF_RATINGS = [1000, 1120, 1085, 1240, 1210, 1330, 1450, 1405, 1520, 1490, 1580, 1642, 1610, 1705, 1690, 1760];
const CF_W = 520;
const CF_H = 220;
const CF_PAD_X = 34;
const CF_TOP = 10;
const CF_BOTTOM = 206;
const CF_MIN = 1000;
const CF_MAX = 2000;

const cfX = (i) => CF_PAD_X + i * ((CF_W - CF_PAD_X * 2) / (CF_RATINGS.length - 1));
const cfY = (r) => CF_BOTTOM - ((r - CF_MIN) / (CF_MAX - CF_MIN)) * (CF_BOTTOM - CF_TOP);

const CF_POINTS = CF_RATINGS.map((r, i) => [cfX(i), cfY(r)]);
const CF_LINE = CF_POINTS.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
const CF_AREA = `${CF_LINE} L${CF_POINTS[CF_POINTS.length - 1][0].toFixed(1)} ${CF_BOTTOM} L${CF_POINTS[0][0].toFixed(1)} ${CF_BOTTOM} Z`;
const CF_BANDS = [
    [1000, 1200, '#808080'],
    [1200, 1400, '#2fb344'],
    [1400, 1600, '#03a89e'],
    [1600, 1900, '#4f8cff'],
    [1900, 2000, '#c65bff'],
];
const CF_TICKS = [1200, 1400, 1600, 1900];

// LeetCode-style solved ring (Easy / Medium / Hard)
const RING = (() => {
    const r = 40;
    const c = 2 * Math.PI * r;
    let offset = 0;
    const segs = [
        ['#00b8a3', 0.41],
        ['#ffc01e', 0.47],
        ['#ef4743', 0.12],
    ].map(([color, frac]) => {
        const len = Math.max(frac * c - 4, 0);
        const seg = { color, len, gap: c - len, offset };
        offset += frac * c;
        return seg;
    });
    return { r, segs };
})();

// LeetCode-style submission heatmap (deterministic pseudo-random)
const HEAT_COLS = 30;
const HEAT_FILL = ['#ffffff12', '#0e4429', '#006d32', '#26a641', '#39d353'];
const HEAT = (() => {
    let x = 7 * 9301 + 49297;
    const rnd = () => {
        x = (x * 9301 + 49297) % 233280;
        return x / 233280;
    };
    const cells = [];
    for (let c = 0; c < HEAT_COLS; c++) {
        for (let r = 0; r < 7; r++) {
            const v = rnd();
            cells.push({ c, r, level: v < 0.4 ? 0 : v < 0.63 ? 1 : v < 0.82 ? 2 : v < 0.94 ? 3 : 4 });
        }
    }
    return cells;
})();

/* ------------------------------------------------------------------ */
/*  Background cards                                                   */
/* ------------------------------------------------------------------ */

function ArtCard({ className = '', rotate, opacity = 1, delay = '0s', children }) {
    return (
        <div
            aria-hidden="true"
            className={`ct-art absolute rounded-2xl border border-white/10 bg-[#10141c] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] ${className}`}
            style={{ '--r': rotate, '--o': opacity, animationDelay: delay }}
        >
            {children}
        </div>
    );
}

function CodeforcesArt() {
    return (
        <div className="p-4">
            <div className="flex items-end justify-between mb-3">
                <div>
                    <div className="text-[11px] text-[#8a90a4]">Contest rating</div>
                    <div className="text-3xl font-bold text-[#f2f4f8]" style={{ fontFamily: FONT_MONO }}>
                        1760
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-semibold text-[#4f8cff]">Expert</div>
                    <div className="text-xs text-[#2fd9a8]" style={{ fontFamily: FONT_MONO }}>
                        +70
                    </div>
                </div>
            </div>

            <svg viewBox={`0 0 ${CF_W} ${CF_H}`} className="w-full h-auto block">
                <defs>
                    <linearGradient id="cf-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffd166" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {CF_BANDS.map(([from, to, color]) => (
                    <rect
                        key={from}
                        x={CF_PAD_X - 10}
                        y={cfY(to)}
                        width={CF_W - CF_PAD_X * 2 + 20}
                        height={cfY(from) - cfY(to)}
                        fill={color}
                        opacity="0.16"
                    />
                ))}

                {CF_TICKS.map((t) => (
                    <g key={t}>
                        <line x1={CF_PAD_X - 10} x2={CF_W - CF_PAD_X + 10} y1={cfY(t)} y2={cfY(t)} stroke="#ffffff" strokeOpacity="0.08" />
                        <text x="4" y={cfY(t) + 3} fontSize="9" fill="#8a90a4" fontFamily="monospace">
                            {t}
                        </text>
                    </g>
                ))}

                <path className="ct-area" d={CF_AREA} fill="url(#cf-fill)" />
                <path
                    className="ct-line"
                    d={CF_LINE}
                    pathLength="1"
                    fill="none"
                    stroke="#ffd166"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                {CF_POINTS.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="#ffd166" stroke="#10141c" strokeWidth="1.5" />
                ))}
            </svg>
        </div>
    );
}

function LeetCodeArt() {
    const cell = 10;
    const gap = 3;
    const heatW = HEAT_COLS * (cell + gap);
    const heatH = 7 * (cell + gap);

    return (
        <div className="p-4">
            <div className="flex items-center gap-5">
                <div className="relative w-[92px] h-[92px] shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r={RING.r} fill="none" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="9" />
                        {RING.segs.map((seg) => (
                            <circle
                                key={seg.color}
                                cx="50"
                                cy="50"
                                r={RING.r}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth="9"
                                strokeLinecap="round"
                                strokeDasharray={`${seg.len} ${seg.gap}`}
                                strokeDashoffset={-seg.offset}
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-[#f2f4f8]" style={{ fontFamily: FONT_MONO }}>
                            412
                        </span>
                        <span className="text-[10px] text-[#8a90a4]">Solved</span>
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    {[
                        ['Easy', 168, '#00b8a3', 0.41],
                        ['Medium', 201, '#ffc01e', 0.49],
                        ['Hard', 43, '#ef4743', 0.1],
                    ].map(([label, n, color, frac]) => (
                        <div key={label}>
                            <div className="flex justify-between text-[11px]">
                                <span style={{ color }}>{label}</span>
                                <span className="text-[#c3c7d4]" style={{ fontFamily: FONT_MONO }}>
                                    {n}
                                </span>
                            </div>
                            <div className="h-1 rounded-full bg-white/5 mt-1">
                                <div className="h-1 rounded-full" style={{ width: `${Math.min(frac * 200, 100)}%`, background: color }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 text-[11px] text-[#8a90a4]">
                <span className="text-[#c3c7d4]" style={{ fontFamily: FONT_MONO }}>
                    186
                </span>{' '}
                submissions in the past year
            </div>
            <svg viewBox={`0 0 ${heatW} ${heatH}`} className="w-full h-auto block mt-2">
                {HEAT.map(({ c, r, level }) => (
                    <rect
                        key={`${c}-${r}`}
                        x={c * (cell + gap)}
                        y={r * (cell + gap)}
                        width={cell}
                        height={cell}
                        rx="2.5"
                        fill={HEAT_FILL[level]}
                    />
                ))}
            </svg>
        </div>
    );
}

function ContestsArt() {
    const rows = [
        ['#ffa116', 'Weekly Contest', 'in 2h'],
        ['#4f8cff', 'Codeforces Round', 'in 1d'],
        ['#2fd9a8', 'GFG Coding Contest', 'in 3d'],
    ];
    return (
        <div className="p-3 space-y-2">
            {rows.map(([color, name, when]) => (
                <div key={name} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-[#e6e8ef]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                        {name}
                    </span>
                    <span className="text-[11px] text-[#8a90a4]" style={{ fontFamily: FONT_MONO }}>
                        {when}
                    </span>
                </div>
            ))}
        </div>
    );
}

function HeroBackdrop() {
    return (
        <div className="absolute inset-0 -z-0 overflow-hidden" aria-hidden="true">
            {/* soft colour glows: blue for Codeforces, orange for LeetCode */}
            <div className="absolute -top-32 right-[8%] w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,#4f8cff30,transparent_68%)]" />
            <div className="absolute top-[38%] right-[-6%] w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,#ffa11628,transparent_68%)]" />

            {/* faint dot grid, fades out towards the left */}
            <div
                className="absolute inset-0 bg-[radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:22px_22px]"
                style={{ maskImage: 'linear-gradient(90deg, transparent 20%, #000 75%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 20%, #000 75%)' }}
            />

            {/* the "screenshots" */}
            <ArtCard rotate="5deg" opacity={0.95} delay="0.1s" className="w-[400px] md:w-[520px] right-[-150px] md:right-[-30px] top-6">
                <CodeforcesArt />
            </ArtCard>

            <ArtCard rotate="-4deg" opacity={0.95} delay="0.35s" className="hidden md:block w-[400px] right-[7%] top-[290px]">
                <LeetCodeArt />
            </ArtCard>

            <ArtCard rotate="-3deg" opacity={0.8} delay="0.6s" className="hidden xl:block w-[290px] left-[46%] bottom-10">
                <ContestsArt />
            </ArtCard>

            {/* keep the headline readable: solid on the left, clear on the right */}
            <div className="absolute inset-0 bg-[#0b0e14]/70 lg:hidden" />
            <div className="absolute inset-0 hidden lg:block bg-[linear-gradient(90deg,#0b0e14_0%,#0b0e14ee_34%,#0b0e1466_62%,transparent_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b0e14] to-transparent" />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function PlatformBadge({ mono, color }) {
    return (
        <span
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{ color, background: `${color}22`, border: `1px solid ${color}55`, fontFamily: FONT_MONO }}
        >
            {mono}
        </span>
    );
}

function Home() {
    const { user } = useSelector((state) => state.auth);

    return (
        <main className="relative overflow-hidden text-[#e6e8ef]" style={{ background: BG, fontFamily: FONT_SANS }}>
            <style>{PAGE_CSS}</style>

            {/* ---------- Hero ---------- */}
            <section className="relative isolate min-h-[680px]">
                <HeroBackdrop />

                <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-28">
                    <div className="max-w-xl">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#f2f4f8] leading-[1.02] tracking-tight mb-6">
                            Every judge.
                            <br />
                            One scoreboard.
                        </h1>

                        <p className="text-base text-[#a3a9bb] leading-relaxed mb-4 max-w-lg">
                            ContTrack links your handles across LeetCode, Codeforces, GeeksforGeeks,
                            HackerRank, AtCoder and Code360. Every upcoming contest lands in a single feed,
                            and every solve lands on one dashboard.
                        </p>

                        <p className="text-sm text-[#8a90a4] leading-relaxed mb-10 max-w-lg">
                            Ratings are read from{' '}
                            <span className="text-[#e6e8ef]">LeetCode, Codeforces, GeeksforGeeks and HackerRank</span>.
                            Problems solved are counted on <span className="text-[#e6e8ef]">all six</span>.
                        </p>

                        {user ? (
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                                <Link
                                    to="/contests"
                                    className="text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-[0_10px_30px_-10px_#4f8cffaa]"
                                >
                                    View contests
                                </Link>
                                <span className="text-sm text-[#a3a9bb]">
                                    Welcome back, <span className="text-[#f2f4f8] font-medium">{user.username}</span>.
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    to="/register"
                                    className="text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-[0_10px_30px_-10px_#4f8cffaa]"
                                >
                                    Register
                                </Link>
                                <Link
                                    to="/login"
                                    className="text-sm font-semibold text-[#e6e8ef] border border-white/15 bg-[#0b0e14]/60 px-6 py-3 rounded-xl hover:border-[#4f8cff] transition-colors"
                                >
                                    Log in
                                </Link>
                                <span className="text-xs text-[#8a90a4] w-full sm:w-auto sm:ml-2">
                                    Create an account to link your handles.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ---------- What gets counted ---------- */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24 -mt-6">
                <h2 className="text-2xl font-bold text-[#f2f4f8] mb-2">What ContTrack counts</h2>
                <p className="text-sm text-[#8a90a4] mb-6 max-w-2xl">
                    Rating comes from {RATED_COUNT} platforms. Problems solved come from all {PLATFORMS.length}.
                </p>

                <div className="rounded-2xl border border-[#232838] bg-[#10141c] overflow-hidden">
                    <div className="grid grid-cols-[1fr_84px_112px] sm:grid-cols-[1fr_150px_170px] px-5 py-3 text-xs text-[#8a90a4] border-b border-[#232838]">
                        <span>Platform</span>
                        <span className="text-center">Rating</span>
                        <span className="text-center">Problems solved</span>
                    </div>

                    {PLATFORMS.map((p, i) => (
                        <div
                            key={p.key}
                            className={`grid grid-cols-[1fr_84px_112px] sm:grid-cols-[1fr_150px_170px] items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors ${
                                i !== PLATFORMS.length - 1 ? 'border-b border-[#1b2130]' : ''
                            }`}
                        >
                            <span className="flex items-center gap-3 min-w-0">
                                <PlatformBadge mono={p.mono} color={p.color} />
                                <span className="text-sm font-medium text-[#e6e8ef] truncate">{p.label}</span>
                            </span>

                            <span className="flex justify-center">
                                {p.rating ? (
                                    <span
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{ background: `${p.color}22`, color: p.color }}
                                        title="Rating is tracked"
                                    >
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                ) : (
                                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[#4b5266]" title="No rating tracked">
                                        <Minus size={14} />
                                    </span>
                                )}
                            </span>

                            <span className="flex justify-center">
                                <span
                                    className="w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{ background: `${p.color}22`, color: p.color }}
                                    title="Problems solved are tracked"
                                >
                                    <Check size={14} strokeWidth={3} />
                                </span>
                            </span>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-[#8a90a4] mt-4">
                    AtCoder and Code360 count toward problems solved only. Ratings come from the other four.
                </p>
            </section>
        </main>
    )
}

export default Home