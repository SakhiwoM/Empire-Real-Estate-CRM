import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { BRAND } from "../utils/branding";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggleSwitch from "./ThemeToggleSwitch";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/contacts", label: "Contacts" },
  { to: "/requirements", label: "Requirements" },
  { to: "/properties", label: "Properties" },
  { to: "/follow-ups", label: "Follow-ups" },
  { to: "/viewings", label: "Viewings" },
  { to: "/reports", label: "Reports" },
  { to: "/backup-export", label: "Backup/Export" },
];

function NavLinks({ onNavigate }) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `block rounded-xl px-3 py-2 text-sm font-semibold tracking-wide transition ${
              isActive
                ? "bg-gradient-to-r from-brand-700 to-brand-500 text-white shadow-md shadow-brand-200/60"
                : "text-slate-700 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLabel = useMemo(() => {
    const match = navItems.find((item) => item.to === location.pathname);
    return match ? match.label : BRAND.appName;
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-900/30" />
      <div className="pointer-events-none absolute -right-16 top-20 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-900/20" />
      <div className="fixed right-5 top-5 z-30 hidden md:block">
        <ThemeToggleSwitch />
      </div>

      <header className="border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img
              src={BRAND.logoPath}
              alt={BRAND.companyName}
              className="h-11 w-11 rounded-lg border border-slate-200 bg-white object-contain p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <div>
              <Link to="/" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {BRAND.appName}
              </Link>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{user?.username || BRAND.companyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleSwitch />
            <button
              type="button"
              className="btn btn-secondary px-3 py-1.5 text-xs"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{currentLabel}</p>
        {mobileOpen && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <button type="button" className="btn btn-danger mt-2 w-full" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </header>

      <div className="relative z-10 mx-auto flex max-w-[1520px] gap-4 px-3 pb-4 pt-3 md:px-5 md:pb-6 md:pt-5">
        <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-72 rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-slate-950/40 md:flex md:flex-col">
          <Link to="/" className="mb-5 block">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <img src={BRAND.logoPath} alt={BRAND.companyName} className="w-full rounded-xl object-contain" />
            </div>
            <h1 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">{BRAND.appName}</h1>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Owner: {user?.username || "owner"}
            </p>
          </Link>

          <div className="mb-3">
            <button type="button" className="btn btn-danger w-full" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <NavLinks />

          <div className="mt-auto rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4 dark:border-brand-900/50 dark:from-brand-950/40 dark:to-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">Core Services</p>
            <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-200">{BRAND.services.join(" | ")}</p>
            <p className="mt-3 text-xs italic text-slate-600 dark:text-slate-300">{BRAND.trustLine}</p>
          </div>
        </aside>

        <main className="w-full rounded-3xl border border-slate-200/70 bg-white/60 p-4 shadow-xl shadow-slate-200/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-950/40 md:p-6">
          <div className="page-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
