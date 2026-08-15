import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "", displayName: "", email: "", password: "", accountType: "personal",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-panel px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">R</div>
          <h1 className="text-xl font-semibold text-ink">Create your account</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Display name">
            <input className="input" value={form.displayName} onChange={set("displayName")} required maxLength={50} />
          </Field>
          <Field label="Username">
            <input
              className="input"
              value={form.username}
              onChange={set("username")}
              required
              pattern="[a-z0-9_]{3,24}"
              title="3-24 characters: lowercase letters, numbers, underscores"
            />
          </Field>
          <Field label="Email">
            <input type="email" className="input" value={form.email} onChange={set("email")} required />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={set("password")}
              required
              minLength={8}
              title="At least 8 characters, with a letter and a number"
            />
          </Field>
          <Field label="Account type">
            <select className="input" value={form.accountType} onChange={set("accountType")}>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 transition disabled:opacity-60 mt-2"
          >
            {busy ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-700 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
      <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; font-size: 0.875rem; } .input:focus { outline: none; box-shadow: 0 0 0 2px #25d366; }`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
