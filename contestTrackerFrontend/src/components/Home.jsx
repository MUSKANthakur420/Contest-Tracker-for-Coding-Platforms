import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const PLATFORMS = [
    { label: 'LeetCode', mono: 'LC', color: '#ffa116' },
    { label: 'Codeforces', mono: 'CF', color: '#4f8cff' },
    { label: 'GeeksforGeeks', mono: 'GFG', color: '#2fd9a8' },
    { label: 'HackerRank', mono: 'HR', color: '#2ec866' },
    { label: 'AtCoder', mono: 'AC', color: '#8b7cf6' },
    { label: 'Code360', mono: 'C3', color: '#ff6b6b' },
    { label: 'CodeChef', mono: 'CC', color: '#d9a066' },
];

const STEPS = [
    ['Link your handles', 'Add your usernames once. ContTrack finds your profiles on all seven judges.'],
    ['See every contest', 'Upcoming rounds from every platform sit in one feed, sorted by start time.'],
    ['Watch your progress', 'Your solves and your rating history land on one dashboard.'],
];

const GITHUB_URL = 'https://github.com/MUSKANthakur420';
const LINKEDIN_URL = 'https://www.linkedin.com/in/YOUR-LINKEDIN-ID'; // <- replace with your LinkedIn URL

const BG = '#0b0e14';
const SANS = "'Space Grotesk', 'Inter', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
@keyframes ct-rise { from { opacity:0; transform:translateY(28px) rotate(var(--r)); } to { opacity:var(--o,1); transform:translateY(0) rotate(var(--r)); } }
@keyframes ct-draw { to { stroke-dashoffset: 0; } }
@keyframes ct-fade { from { opacity:0; } to { opacity:1; } }
@keyframes ct-scroll { to { transform: translateX(-50%); } }
.ct-art { transform:rotate(var(--r)); opacity:var(--o,1); animation:ct-rise .9s cubic-bezier(.2,.7,.2,1) both; }
.ct-line { stroke-dasharray:1; stroke-dashoffset:1; animation:ct-draw 1.6s .5s cubic-bezier(.4,0,.2,1) forwards; }
.ct-area { animation:ct-fade 1s 1.4s both; }
.ct-track { animation:ct-scroll 32s linear infinite; }
.ct-headline { background:linear-gradient(100deg,#f2f4f8 30%,#8fb4ff 62%,#ffd166 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
@media (prefers-reduced-motion: reduce) {
  .ct-art,.ct-area,.ct-track { animation:none; }
  .ct-line { animation:none; stroke-dashoffset:0; }
}
`;

/* ---------- background art data ---------- */
const CF = [1000, 1120, 1085, 1240, 1210, 1330, 1450, 1405, 1520, 1490, 1580, 1642, 1610, 1705, 1690, 1760];
const W = 520, H = 220, PX = 34, TOP = 10, BOT = 206, MIN = 1000, MAX = 2000;
const cx = (i) => PX + i * ((W - PX * 2) / (CF.length - 1));
const cy = (r) => BOT - ((r - MIN) / (MAX - MIN)) * (BOT - TOP);
const PTS = CF.map((r, i) => [cx(i), cy(r)]);
const LINE = PTS.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
const AREA = `${LINE} L${PTS[PTS.length - 1][0].toFixed(1)} ${BOT} L${PTS[0][0].toFixed(1)} ${BOT} Z`;
const BANDS = [[1000, 1200, '#808080'], [1200, 1400, '#2fb344'], [1400, 1600, '#03a89e'], [1600, 1900, '#4f8cff'], [1900, 2000, '#c65bff']];

const RING = (() => {
    const r = 40, c = 2 * Math.PI * r;
    let offset = 0;
    return [['#00b8a3', 0.41], ['#ffc01e', 0.47], ['#ef4743', 0.12]].map(([color, f]) => {
        const len = Math.max(f * c - 4, 0);
        const s = { color, len, gap: c - len, offset };
        offset += f * c;
        return s;
    });
})();

const HEAT_FILL = ['#ffffff12', '#0e4429', '#006d32', '#26a641', '#39d353'];
const HEAT = (() => {
    let x = 7 * 9301 + 49297;
    const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
    const out = [];
    for (let c = 0; c < 30; c++)
        for (let r = 0; r < 7; r++) {
            const v = rnd();
            out.push({ c, r, l: v < 0.4 ? 0 : v < 0.63 ? 1 : v < 0.82 ? 2 : v < 0.94 ? 3 : 4 });
        }
    return out;
})();

/* ---------- background cards ---------- */
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

function RatingArt() {
    return (
        <div className="p-4">
            <div className="flex items-end justify-between mb-3">
                <div>
                    <div className="text-[11px] text-[#8a90a4]">Contest rating</div>
                    <div className="text-3xl font-bold text-[#f2f4f8]" style={{ fontFamily: MONO }}>1760</div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-semibold text-[#4f8cff]">Expert</div>
                    <div className="text-xs text-[#2fd9a8]" style={{ fontFamily: MONO }}>+70</div>
                </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
                <defs>
                    <linearGradient id="ct-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffd166" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {BANDS.map(([a, b, color]) => (
                    <rect key={a} x={PX - 10} y={cy(b)} width={W - PX * 2 + 20} height={cy(a) - cy(b)} fill={color} opacity="0.16" />
                ))}
                <path className="ct-area" d={AREA} fill="url(#ct-fill)" />
                <path className="ct-line" d={LINE} pathLength="1" fill="none" stroke="#ffd166" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {PTS.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="#ffd166" stroke="#10141c" strokeWidth="1.5" />
                ))}
            </svg>
        </div>
    );
}

function SolvedArt() {
    const cell = 10, gap = 3;
    return (
        <div className="p-4">
            <div className="flex items-center gap-5">
                <div className="relative w-[92px] h-[92px] shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="9" />
                        {RING.map((s) => (
                            <circle key={s.color} cx="50" cy="50" r="40" fill="none" stroke={s.color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${s.len} ${s.gap}`} strokeDashoffset={-s.offset} />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-[#f2f4f8]" style={{ fontFamily: MONO }}>412</span>
                        <span className="text-[10px] text-[#8a90a4]">Solved</span>
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    {[['Easy', 168, '#00b8a3', 41], ['Medium', 201, '#ffc01e', 49], ['Hard', 43, '#ef4743', 10]].map(([l, n, color, w]) => (
                        <div key={l}>
                            <div className="flex justify-between text-[11px]">
                                <span style={{ color }}>{l}</span>
                                <span className="text-[#c3c7d4]" style={{ fontFamily: MONO }}>{n}</span>
                            </div>
                            <div className="h-1 rounded-full bg-white/5 mt-1"><div className="h-1 rounded-full" style={{ width: `${w * 2}%`, background: color }} /></div>
                        </div>
                    ))}
                </div>
            </div>
            <svg viewBox={`0 0 ${30 * (cell + gap)} ${7 * (cell + gap)}`} className="w-full h-auto block mt-4">
                {HEAT.map(({ c, r, l }) => (
                    <rect key={`${c}-${r}`} x={c * (cell + gap)} y={r * (cell + gap)} width={cell} height={cell} rx="2.5" fill={HEAT_FILL[l]} />
                ))}
            </svg>
        </div>
    );
}

function Backdrop() {
    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-32 right-[8%] w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,#4f8cff38,transparent_68%)]" />
            <div className="absolute top-[38%] right-[-6%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,#ffa11630,transparent_68%)]" />
            <div
                className="absolute inset-0 bg-[radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:22px_22px]"
                style={{ maskImage: 'linear-gradient(90deg,transparent 20%,#000 75%)', WebkitMaskImage: 'linear-gradient(90deg,transparent 20%,#000 75%)' }}
            />
            <ArtCard rotate="5deg" opacity={0.95} delay="0.1s" className="w-[400px] md:w-[520px] right-[-150px] md:right-[-30px] top-6">
                <RatingArt />
            </ArtCard>
            <ArtCard rotate="-4deg" opacity={0.95} delay="0.35s" className="hidden md:block w-[400px] right-[7%] top-[290px]">
                <SolvedArt />
            </ArtCard>
            <div className="absolute inset-0 bg-[#0b0e14]/70 lg:hidden" />
            <div className="absolute inset-0 hidden lg:block bg-[linear-gradient(90deg,#0b0e14_0%,#0b0e14ee_34%,#0b0e1466_62%,transparent_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b0e14] to-transparent" />
        </div>
    );
}

function Chip({ label, mono, color }) {
    return (
        <span className="flex items-center gap-3 rounded-full border border-white/10 bg-[#10141c] pl-2 pr-5 py-2 shrink-0">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ color, background: `${color}22`, border: `1px solid ${color}55`, fontFamily: MONO }}>
                {mono}
            </span>
            <span className="text-sm font-medium text-[#e6e8ef] whitespace-nowrap">{label}</span>
        </span>
    );
}

/* ---------- footer ---------- */
function GitHubIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
        </svg>
    );
}

function LinkedInIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
        </svg>
    );
}

function Footer() {
    const link = 'inline-flex items-center gap-2 text-sm text-[#a3a9bb] hover:text-[#8fb4ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fb4ff] rounded transition-colors';
    return (
        <footer className="relative z-10 border-t border-white/10">
            <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-[#8a90a4]">
                    Made by <span className="text-[#f2f4f8] font-semibold">Muskan Singh</span>
                </p>
                <div className="flex items-center gap-6">
                    <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={link}>
                        <GitHubIcon /> GitHub
                    </a>
                    <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={link}>
                        <LinkedInIcon /> LinkedIn
                    </a>
                </div>
            </div>
        </footer>
    );
}

function Home() {
    const { user } = useSelector((state) => state.auth);
    const primary = 'text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-7 py-3.5 rounded-xl hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fb4ff] transition-opacity shadow-[0_10px_30px_-10px_#4f8cffaa]';
    const ghost = 'text-sm font-semibold text-[#e6e8ef] border border-white/15 bg-[#0b0e14]/60 px-7 py-3.5 rounded-xl hover:border-[#4f8cff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fb4ff] transition-colors';

    return (
        <main className="relative overflow-hidden text-[#e6e8ef]" style={{ background: BG, fontFamily: SANS }}>
            <style>{PAGE_CSS}</style>

            {/* Hero */}
            <section className="relative isolate min-h-[700px]">
                <Backdrop />
                <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-32">
                    <div className="max-w-2xl">
                        <h1 className="ct-headline text-6xl sm:text-7xl lg:text-[88px] font-bold leading-[0.98] tracking-tight mb-7">
                            Every judge.
                            <br />
                            One scoreboard.
                        </h1>
                        <p className="text-lg text-[#a3a9bb] leading-relaxed mb-10 max-w-lg">
                            Link your handles from LeetCode, Codeforces, GeeksforGeeks, HackerRank, AtCoder, Code360 and CodeChef.
                            One feed for every contest, one dashboard for every solve.
                        </p>

                        {user ? (
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                                <Link to="/contests" className={primary}>View contests</Link>
                                <span className="text-sm text-[#a3a9bb]">
                                    Welcome back, <span className="text-[#f2f4f8] font-medium">{user.username}</span>.
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                <Link to="/register" className={primary}>Register</Link>
                                <Link to="/login" className={ghost}>Log in</Link>
                                <span className="text-xs text-[#8a90a4] w-full sm:w-auto sm:ml-2">Create an account to link your handles.</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Platform ticker */}
            <section className="relative z-10 -mt-10 pb-24" aria-label="Supported platforms">
                <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)' }}>
                    <div className="ct-track flex gap-4 w-max">
                        {[...PLATFORMS, ...PLATFORMS, ...PLATFORMS, ...PLATFORMS].map((p, i) => (
                            <Chip key={i} {...p} />
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
                <h2 className="text-3xl sm:text-4xl font-bold text-[#f2f4f8] mb-10 max-w-lg leading-tight">
                    Set up in a minute. Stay on top all season.
                </h2>
                <div className="grid md:grid-cols-3 gap-5">
                    {STEPS.map(([title, body], i) => (
                        <div key={title} className="rounded-2xl border border-[#232838] bg-[#10141c] p-6 hover:border-[#4f8cff66] transition-colors">
                            <span className="text-sm font-bold text-[#4f8cff]" style={{ fontFamily: MONO }}>{i + 1}</span>
                            <h3 className="text-lg font-semibold text-[#f2f4f8] mt-3 mb-2">{title}</h3>
                            <p className="text-sm text-[#8a90a4] leading-relaxed">{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Closing CTA */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#10141c] px-8 py-14 sm:px-14 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                    <div className="absolute -right-24 -top-24 w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,#4f8cff30,transparent_70%)]" aria-hidden="true" />
                    <h2 className="relative text-3xl sm:text-4xl font-bold text-[#f2f4f8] max-w-md leading-tight">
                        Your next contest is already on the list.
                    </h2>
                    <Link to={user ? '/contests' : '/register'} className={`${primary} relative self-start sm:self-auto whitespace-nowrap`}>
                        {user ? 'View contests' : 'Create your account'}
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}

export default Home;