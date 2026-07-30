import { useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { formatScore } from "../format";

const SAMPLE = [
  { score: 10, title: "Blonde", artist: "Frank Ocean" },
  { score: 9.25, title: "To Pimp a Butterfly", artist: "Kendrick Lamar" },
  { score: 8.5, title: "Loveless", artist: "My Bloody Valentine" },
  { score: 6.5, title: "Currents", artist: "Tame Impala" },
];

const STEPS = [
  {
    title: "Rate what you played",
    body: "Search a catalogue of millions, then land anywhere between 1 and 10 — including 8.75, if that is the honest answer.",
  },
  {
    title: "Go track by track",
    body: "Mark the songs that earn their place on the album and the ones you would cut. The record keeps score.",
  },
  {
    title: "Keep it between friends",
    body: "Requests go both ways and only accepted friends can open your profile. Everyone else sees a locked door.",
  },
];

export default function LandingPage() {
  const { demo } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function tour() {
    setBusy(true);
    setNotice("");
    try {
      await demo();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not start the tour");
      setBusy(false);
    }
  }

  return (
    <main className="landing">
      <section className="landing-hero">
        <div>
          <p className="wordmark landing-mark">
            Track<span>Record</span>
          </p>
          <p className="eyebrow">a private log of everything you listened to</p>

          <h1 className="headline">
            Your taste, on the record.
          </h1>

          <p className="lede">
            Rate every album and single you hear, argue with yourself over the
            decimal, and let only the friends you accept see the result.
          </p>

          <div className="landing-actions">
            <button className="btn" disabled={busy} onClick={() => void tour()}>
              {busy ? "Setting up the sample…" : "See a sample record"}
            </button>
            <Link className="btn quiet" to="/register">
              Create an account
            </Link>
          </div>

          <p className="landing-note">
            The sample signs you into a demo profile that already has ratings
            and a friend — no email, no password, nothing to fill in. It is
            rebuilt fresh for every visitor.
          </p>

          {notice && <p className="notice">{notice}</p>}

          <p className="switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>

        <div className="landing-sample" aria-hidden="true">
          <div className="landing-sample-head">
            <span>the record</span>
            <span>8.56 avg</span>
          </div>
          {SAMPLE.map((item) => (
            <div className="landing-row" key={item.title}>
              <span
                className={
                  "score" + (Number.isInteger(item.score) ? "" : " fractional")
                }
                style={
                  {
                    "--weight": item.score / 10,
                    fontWeight: 400 + Math.round((item.score / 10) * 500),
                  } as CSSProperties
                }
              >
                {formatScore(item.score)}
              </span>
              <span className="landing-row-body">
                <span className="entry-title">{item.title}</span>
                <span className="entry-sub">{item.artist}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="section-rule">
        <h2>how it works</h2>
      </div>

      <ol className="steps">
        {STEPS.map((step, index) => (
          <li className="step" key={step.title}>
            <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>

      <footer className="landing-foot">
        <span>TrackRecord</span>
        <span>Node · Express · Prisma · React</span>
      </footer>
    </main>
  );
}
