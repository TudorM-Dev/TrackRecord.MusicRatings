import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    setBusy(true);
    try {
      await register(email, username, password);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Could not create the account",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gate">
      <div className="gate-inner">
        <Link className="wordmark" to="/">
          Track<span>Record</span>
        </Link>
        <p className="gate-tagline">Start keeping score.</p>

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
            <span>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label className="field">
            <span>Password · 8 characters minimum</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </label>

          {notice && <p className="notice">{notice}</p>}

          <button
            className="btn"
            type="submit"
            disabled={busy}
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {busy ? "Creating account" : "Create account"}
          </button>
        </form>

        <p className="switch">
          Already have one? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
