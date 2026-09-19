import { Link } from "react-router-dom";

const PLATFORMS = [
  { name: "Codeforces", href: "https://codeforces.com", color: "#ff3d3d" },
  { name: "LeetCode", href: "https://leetcode.com", color: "#ffa116" },
  { name: "gfg", href: "https://geeksforgeeks.com", color: "#a25eff" },
  { name: "AtCoder", href: "https://atcoder.jp", color: "#3f7fbf" },
  { name: "HackerRank", href: "https://hackerrank.com", color: "#2f8d46" },
    { name: "Naukri", href: "https://naukri.com", color: "#ff7a00" },
];

export default function Footer({ trackedCount = 6 }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 bg-[#0b0e14] border-t border-[#232838]">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-6 grid grid-cols-1 sm:grid-cols-4 gap-8">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <div className="font-mono font-semibold text-[#e6e8ef]">
            <span className="text-[#4f8cff] mr-1">&gt;_</span>ContTrack
          </div>
          <p className="font-sans text-sm text-[#8a90a6] leading-relaxed max-w-[32ch]">
            One place to catch every contest before the clock runs out.
          </p>
          <div className="flex items-center gap-2 font-mono text-xs text-[#8a90a6] mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] shadow-[0_0_6px_#3fb950]" aria-hidden="true" />
            Tracking {trackedCount} platforms live
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#545b70]">
            Navigate
          </h4>
          <Link to="/" className="font-sans text-sm text-[#c9d1d9] hover:text-[#4f8cff] w-fit transition-colors">
            Home
          </Link>
          <Link to="/contests" className="font-sans text-sm text-[#c9d1d9] hover:text-[#4f8cff] w-fit transition-colors">
            Contests
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#545b70]">
            Platforms
          </h4>
          {PLATFORMS.map((platform) => (
            <a
              key={platform.name}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-sans text-sm text-[#c9d1d9] hover:text-[#4f8cff] w-fit transition-colors"
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: platform.color }}
                aria-hidden="true"
              />
              {platform.name}
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#545b70] border-t border-[#171b26] font-sans">
        <span>© {year} ContTrack</span>
        <a
          href="https://linkedin.com/in/muskan-singh-72b338328"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8a90a6] hover:text-[#4f8cff] transition-colors"
        >
          LinkedIn
        </a>
        <span>Built for people who'd rather compete than forget the start time.</span>
      </div>
    </footer>
  );
}