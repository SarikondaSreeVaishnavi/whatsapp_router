import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(identifier, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-panel px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">R</div>
          <h1 className="text-xl font-semibold text-ink">Router</h1>
        </div>
        <p className="text-sm text-muted mb-6">Log in to your account</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Username or email</label>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 transition disabled:opacity-60"
          >
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-brand-700 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
