import { useEffect, useState } from "react";
import { BRAND } from "../utils/branding";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggleSwitch from "../components/ThemeToggleSwitch";

const initialLogin = { username: "", password: "" };
const initialSetup = { username: "", password: "", confirm_password: "", full_name: "" };

export default function LoginPage() {
  const { login, setupOwner, requiresSetup, refreshAuth } = useAuth();
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [setupForm, setSetupForm] = useState(initialSetup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(requiresSetup ? "setup" : "login");

  useEffect(() => {
    setMode(requiresSetup ? "setup" : "login");
  }, [requiresSetup]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(loginForm);
      await refreshAuth();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (setupForm.password !== setupForm.confirm_password) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await setupOwner({
        username: setupForm.username,
        password: setupForm.password,
        full_name: setupForm.full_name,
      });
      await refreshAuth();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-900/30" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-900/20" />
      <div className="fixed right-5 top-5 z-30">
        <ThemeToggleSwitch />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center p-4">
        <div className="grid w-full gap-6 lg:grid-cols-2">
          <section className="card self-stretch">
            <img src={BRAND.logoPath} alt={BRAND.companyName} className="mb-4 w-full rounded-xl bg-white p-3 object-contain" />
            <h1 className="text-3xl font-semibold">{BRAND.appName}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{BRAND.companyName}</p>
            <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
              Secure internal workspace for owner-only operations.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {BRAND.services.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="mb-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMode(requiresSetup ? "setup" : "login")}
                disabled
              >
                {requiresSetup ? "Initial Owner Setup" : "Login"}
              </button>
            </div>

            {error ? (
              <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                {error}
              </div>
            ) : null}

            {mode === "setup" ? (
              <form className="space-y-3" onSubmit={handleSetup}>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Create Account</p>
                <div>
                  <label className="label">Full Name (optional)</label>
                  <input
                    className="input"
                    value={setupForm.full_name}
                    onChange={(e) => setSetupForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Username *</label>
                  <input
                    className="input"
                    value={setupForm.username}
                    onChange={(e) => setSetupForm((prev) => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input
                    type="password"
                    className="input"
                    value={setupForm.password}
                    onChange={(e) => setSetupForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Confirm Password *</label>
                  <input
                    type="password"
                    className="input"
                    value={setupForm.confirm_password}
                    onChange={(e) => setSetupForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                    required
                  />
                </div>
                <button className="btn btn-primary w-full" type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Owner & Login"}
                </button>
              </form>
            ) : (
              <form className="space-y-3" onSubmit={handleLogin}>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Login</p>
                <div>
                  <label className="label">Username *</label>
                  <input
                    className="input"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input
                    type="password"
                    className="input"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <button className="btn btn-primary w-full" type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
