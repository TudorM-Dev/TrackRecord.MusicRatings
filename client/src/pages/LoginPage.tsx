import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not log in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gate">
      <div className="gate-inner">
        <span className="wordmark">
          Track<span>Record</span>
        </span>
        <p className="gate-tagline">Every album you rated, on one page.</p>

        <form onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {notice && <p className="notice">{notice}</p>}

          <button
            className="btn"
            type="submit"
            disabled={busy}
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {busy ? "Logging in" : "Log in"}
          </button>
        </form>

        <p className="switch">
          No account yet? <Link to="/register">Start your record</Link>
        </p>
      </div>
    </div>
  );
}
