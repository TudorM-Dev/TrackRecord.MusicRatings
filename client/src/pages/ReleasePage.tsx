import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { formatScore } from "../format";
import { useDocumentTint, useTint } from "../tint";
import type { ReleaseDetail, Track, Verdict } from "../types";

const MIN = 1;
const MAX = 10;
const STEP = 0.25;
const DEFAULT_SCORE = 7;

function Keep() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  );
}

function Cut() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export default function ReleasePage() {
  const { id } = useParams();
  const [release, setRelease] = useState<ReleaseDetail | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [draft, setDraft] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const tint = useTint(release?.coverUrl);
  useDocumentTint(release ? tint : undefined);

  const load = useCallback(async () => {
    try {
      const [detail, trackList] = await Promise.all([
        api.get<ReleaseDetail>(`/api/releases/${id}`),
        api.get<Track[]>(`/api/releases/${id}/tracks`),
      ]);
      setRelease(detail);
      setTracks(trackList);
      setDraft(null);
      setNotice("");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load release");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function change(action: () => Promise<unknown>) {
    setBusy(true);
    setNotice("");
    try {
      await action();
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "That did not work");
    } finally {
      setBusy(false);
    }
  }

  function saveScore(score: number) {
    const clamped = Math.min(MAX, Math.max(MIN, Math.round(score / STEP) * STEP));
    return change(() =>
      api.put(`/api/releases/${id}/rating`, { score: clamped }),
    );
  }

  function setVerdict(track: Track, verdict: Verdict) {
    const url = `/api/releases/${id}/tracks/${track.id}/verdict`;
    return change(() =>
      track.myVerdict === verdict ? api.del(url) : api.put(url, { verdict }),
    );
  }

  if (loading) {
    return (
      <>
        <section className="hero">
          <div className="hero-in">
            <div className="skeleton hero-art" />
            <div>
              <div
                className="skeleton"
                style={{ width: "60%", height: "3rem", borderRadius: 2 }}
              />
              <div
                className="skeleton"
                style={{
                  width: "30%",
                  height: "1rem",
                  marginTop: "1.25rem",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        </section>
        <p className="loading">Loading…</p>
      </>
    );
  }

  if (!release) {
    return (
      <main className="page">
        <h1 className="headline">Nothing here</h1>
        <p className="notice">{notice || "That release could not be found."}</p>
        <div className="actions" style={{ marginTop: "1.5rem" }}>
          <button className="btn" onClick={() => void load()}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  const rated = release.myScore !== null;
  const current = draft ?? release.myScore ?? DEFAULT_SCORE;
  const fill = ((current - MIN) / (MAX - MIN)) * 100;
  const cut = tracks.filter((t) => t.myVerdict === "BAD").length;
  const kept = tracks.filter((t) => t.myVerdict === "GOOD").length;

  return (
    <>
      <section className="hero">
        {release.coverUrl && (
          <div
            className="hero-bg"
            style={{ backgroundImage: `url(${release.coverUrl})` }}
          />
        )}
        <div className="hero-veil" />
        <div className="hero-in">
          <img
            className="hero-art"
            src={release.coverUrl || undefined}
            alt={`${release.title} by ${release.artist}`}
          />
          <div>
            <p className="hero-cat">
              {release.kind === "ALBUM" ? "Album" : "Single"}
              {release.releaseYear ? ` · ${release.releaseYear}` : ""}
              {tracks.length > 0 && ` · ${tracks.length} tracks`}
            </p>
            <h1>{release.title}</h1>
            <p className="hero-artist">{release.artist}</p>

            <div className="hero-nums">
              <div className={rated ? "mine" : "mine empty"}>
                <b>{rated ? formatScore(release.myScore as number) : "—"}</b>
                your score
              </div>
              <div className={release.averageScore === null ? "empty" : ""}>
                <b>
                  {release.averageScore === null
                    ? "—"
                    : release.averageScore.toFixed(2)}
                </b>
                {release.ratingCount === 1
                  ? "from 1 rating"
                  : `average of ${release.ratingCount}`}
              </div>
              {tracks.length > 0 && (
                <div className={cut === 0 ? "empty" : ""}>
                  <b>{cut}</b>
                  {cut === 1 ? "track you'd cut" : "tracks you'd cut"}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="page">
        <div className="section">
          <h2>{rated ? "your score" : "rate it"}</h2>
        </div>

        <div className="scoreband">
          <div className="scoreband-top">
            <span
              className={
                rated || draft !== null
                  ? "scoreband-value"
                  : "scoreband-value empty"
              }
            >
              {formatScore(current)}
              <em>of 10</em>
            </span>
            <span className="scoreband-hint">
              {rated ? "drag, or nudge by 0.25" : "drag to set a score"}
            </span>
          </div>

          <div className="band" style={{ "--fill": `${fill}%` } as CSSProperties}>
            <input
              type="range"
              min={MIN}
              max={MAX}
              step={STEP}
              value={current}
              disabled={busy}
              aria-label="Your score out of 10"
              onChange={(e) => setDraft(Number(e.target.value))}
              onPointerUp={() => draft !== null && void saveScore(draft)}
              onKeyUp={() => draft !== null && void saveScore(draft)}
            />
          </div>

          <div className="band-scale">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>

          <div className="nudge">
            <button
              type="button"
              disabled={busy || current <= MIN}
              onClick={() => void saveScore(current - STEP)}
            >
              &minus;0.25
            </button>
            <button
              type="button"
              disabled={busy || current >= MAX}
              onClick={() => void saveScore(current + STEP)}
            >
              +0.25
            </button>
            {rated && (
              <button
                type="button"
                className="drop"
                disabled={busy}
                onClick={() =>
                  void change(() => api.del(`/api/releases/${id}/rating`))
                }
              >
                Remove my score
              </button>
            )}
          </div>

          {notice && <p className="notice">{notice}</p>}
        </div>

        {tracks.length > 0 && (
          <>
            <div className="section">
              <h2>
                track by track
                {kept + cut > 0 && ` · ${kept} kept · ${cut} cut`}
              </h2>
            </div>

            <div className="tracklist">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={
                    "track" +
                    (track.myVerdict === "GOOD" ? " is-good" : "") +
                    (track.myVerdict === "BAD" ? " is-bad" : "")
                  }
                >
                  <span className="track-number">{track.trackNumber}</span>
                  <span className="track-title">{track.title}</span>
                  <span className="verdicts">
                    <button
                      className="good"
                      aria-pressed={track.myVerdict === "GOOD"}
                      aria-label={`Keep ${track.title}`}
                      title="Earns its place"
                      disabled={busy}
                      onClick={() => void setVerdict(track, "GOOD")}
                    >
                      <Keep />
                    </button>
                    <button
                      className="bad"
                      aria-pressed={track.myVerdict === "BAD"}
                      aria-label={`Cut ${track.title}`}
                      title="Would cut it"
                      disabled={busy}
                      onClick={() => void setVerdict(track, "BAD")}
                    >
                      <Cut />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
