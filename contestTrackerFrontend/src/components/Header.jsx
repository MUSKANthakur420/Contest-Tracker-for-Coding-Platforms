import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../features/auth/authSlice";

// Live UTC clock — most contest sites (Codeforces, AtCoder) schedule in UTC,
// so showing it directly in the header saves a mental timezone conversion.
function useUtcClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const hh = String(time.getUTCHours()).padStart(2, "0");
  const mm = String(time.getUTCMinutes()).padStart(2, "0");
  const ss = String(time.getUTCSeconds()).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

const navLinkClasses = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-sans transition-colors ${
    isActive
      ? "text-[#4f8cff] bg-[#131720]"
      : "text-[#8a90a6] hover:text-[#e6e8ef] hover:bg-[#131720]"
  }`;

const registerLinkClasses = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-sans font-semibold transition-colors ${
    isActive
      ? "text-[#0b0e14] bg-[#4f8cff]"
      : "text-[#4f8cff] bg-[#131720] border border-[#232838] hover:bg-[#4f8cff] hover:text-[#0b0e14]"
  }`;

export default function Header() {
  const utcTime = useUtcClock();
  const [menuOpen, setMenuOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0b0e14] border-b border-[#232838]">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6 relative">
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-1 font-mono font-semibold text-base text-[#e6e8ef] tracking-tight whitespace-nowrap"
        >
          <span className="text-[#4f8cff]">&gt;_</span>
          ContTrack
          <span className="w-2 h-4 bg-[#4f8cff] ml-0.5 animate-pulse" aria-hidden="true" />
        </Link>

        <button
          className="ml-auto flex md:hidden flex-col gap-1 p-2"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span className="w-5 h-0.5 bg-[#e6e8ef] rounded" />
          <span className="w-5 h-0.5 bg-[#e6e8ef] rounded" />
          <span className="w-5 h-0.5 bg-[#e6e8ef] rounded" />
        </button>

        <nav
          className={`${
            menuOpen ? "flex" : "hidden"
          } md:flex flex-col md:flex-row gap-1 absolute md:static top-full left-0 right-0 md:left-auto md:right-auto bg-[#0b0e14] md:bg-transparent border-b md:border-0 border-[#232838] p-2 md:p-0 flex-1`}
        >
          <NavLink to="/" end className={navLinkClasses} onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink
            to="/contests"
            className={navLinkClasses}
            onClick={() => setMenuOpen(false)}
          >
            Contests
          </NavLink>
          {user ? (
            <>
          <NavLink
  to="/dashboard"
  className={navLinkClasses}
  onClick={() => {
    console.log("DASHBOARD CLICKED");
    setMenuOpen(false);
  }}
>
  Dashboard
</NavLink>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-sans text-[#8a90a6] hover:text-[#e6e8ef] hover:bg-[#131720] transition-colors text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={navLinkClasses}
                onClick={() => setMenuOpen(false)}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={registerLinkClasses}
                onClick={() => setMenuOpen(false)}
              >
                Register
              </NavLink>
            </>
          )}
        </nav>

        <div
          className="flex items-center gap-2 font-mono text-sm text-[#8a90a6] bg-[#131720] border border-[#232838] px-3 py-1.5 rounded-md whitespace-nowrap"
          title="Current time in UTC"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] shadow-[0_0_6px_#3fb950]" aria-hidden="true" />
          {utcTime} UTC
        </div>
      </div>
    </header>
  );
}