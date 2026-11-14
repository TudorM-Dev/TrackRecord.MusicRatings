import { useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";

const COVER = (id: string) =>
  `https://cdn-images.dzcdn.net/images/cover/${id}/500x500-000000-80-0-0.jpg`;

const SHOWCASE = [
  {
    id: "de9e79511cda59914de9add50946e43c",
    title: "BRAT",
    artist: "Charli xcx",
    score: "8",
    tint: "#abf514",
  },
  {
    id: "aa7e6de00b0810f5051aa60b489f58d8",
    title: "Blonde",
    artist: "Frank Ocean",
    score: "10",
    tint: "#bc684e",
  },
  {
    id: "742aba8510ba803bea51d304cf2ca786",
    title: "My Beautiful Dark Twisted Fantasy",
    artist: "Kanye West",
    score: "9.5",
    tint: "#ec2540",
  },
  {
    id: "217f6c70913d113d09a561cb17b64f6e",
    title: "loveless",
    artist: "my bloody valentine",
    score: "8.5",
    tint: "#ca3f95",
  },
  {
    id: "a175af9b7d329bc678cb4d26fc13d6de",
    title: "In Rainbows",
    artist: "Radiohead",
    score: "9",
    tint: "#d97430",
  },
  {
    id: "00dd0da365a94b1829302d6b7fec70e6",
    title: "To Pimp A Butterfly",
    artist: "Kendrick Lamar",
    score: "9.75",
    tint: "#c9c2b6",
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

          <h1 className="headline">Your taste, on the record.</h1>

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
            and a friend. No email, no password, nothing to fill in. It is
            rebuilt fresh for every visitor.
          </p>

          {notice && <p className="notice">{notice}</p>}

          <p className="switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>

        <div className="landing-art" aria-hidden="true">
          {SHOWCASE.map((item, index) => (
            <div
              key={item.id}
              className="sleeve"
              title={`${item.title} — ${item.artist}`}
              style={
                {
                  "--tint": item.tint,
                  animationDelay: `${index * 60}ms`,
                } as CSSProperties
              }
            >
              <img src={COVER(item.id)} alt="" decoding="async" />
              <span className="sleeve-score">{item.score}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="section">
        <h2>how it works</h2>
      </div>

      <div className="landing-how">
        <p className="landing-prose">
          Search the catalogue, open a record and put a number on it. Scores run
          from 1 to 10 in quarters, so <b>8.75</b> is a thing you can actually
          say. Inside an album you can go further and mark, track by track, what
          earns its place and what you would cut.
        </p>

        <p className="landing-prose">
          Everything you rate lands on your profile, newest first, with the
          covers doing the talking and each release page taking its colour from
          the sleeve. Nobody sees any of it until you let them: requests go both
          ways, and a stranger gets <b>your name and nothing else</b>.
        </p>
      </div>

      <footer className="landing-foot">
        <span>TrackRecord</span>
        <span>Node · Express · Prisma · React</span>
      </footer>
    </main>
  );
}
