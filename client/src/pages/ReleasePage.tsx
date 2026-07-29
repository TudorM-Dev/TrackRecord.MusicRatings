import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { formatScore } from "../format";
import type { ReleaseDetail, Track, Verdict } from "../types";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const DEFAULT_SCORE = 7;

export default function ReleasePage() {
  const { id } = useParams();
  const [release, setRelease] = useState<ReleaseDetail | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [draft, setDraft] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [detail, trackList] = await Promise.all([
        api.get<ReleaseDetail>(`/api/releases/${id}`),
        api.get<Track[]>(`/api/releases/${id}/tracks`),
      ]);
      setRelease(detail);
      setTracks(trackList);
      setDraft(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load release");
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
    return change(() => api.put(`/api/releases/${id}/rating`, { score }));
  }

  function setVerdict(track: Track, verdict: Verdict) {
    const url = `/api/releases/${id}/tracks/${track.id}/verdict`;
    return change(() =>
      track.myVerdict === verdict ? api.del(url) : api.put(url, { verdict }),
    );
  }

  if (!release) {
    return <p className="loading">{notice || "Loading…"}</p>;
  }

  const current = draft ?? release.myScore ?? DEFAULT_SCORE;
  const rated = release.myScore !== null;
  const good = tracks.filter((t) => t.myVerdict === "GOOD").length;
  const bad = tracks.filter((t) => t.myVerdict === "BAD").length;

  return (
    <main className="page">
      <div className="release">
        <img
          className="release-cover"
          src={release.coverUrl || undefined}
          alt=""
        />

        <div>
          <p className="eyebrow">
            {release.kind === "ALBUM" ? "album" : "single"} ·{" "}
            {release.releaseYear || "—"}
          </p>
          <h1 className="headline">{release.title}</h1>
          <p className="meta">{release.artist}</p>

          <div className="average">
            {release.averageScore === null ? (
              <span className="meta" style={{ margin: 0 }}>
                No ratings yet — yours would be the first.
              </span>
            ) : (
              <>
                <span className="average-value">
                  {release.averageScore.toFixed(2)}
                </span>
                <span className="meta" style={{ margin: 0 }}>
                  from {release.ratingCount}{" "}
                  {release.ratingCount === 1 ? "rating" : "ratings"}
                </span>
              </>
            )}
          </div>

          <div className="section-rule" style={{ marginTop: "2.5rem" }}>
            <h2>{rated ? "your score" : "rate the album"}</h2>
          </div>

          <div className="scorer">
            <div className="scorer-readout">
              <span
                className={
                  rated || draft !== null
                    ? "scorer-value"
                    : "scorer-value empty"
                }
              >
                {formatScore(current)}
              </span>
              <span className="meta" style={{ margin: 0 }}>
                {draft !== null && draft !== release.myScore
                  ? "release to save"
                  : rated
                    ? "out of 10"
                    : "drag or pick a number"}
              </span>
            </div>

            <div className="dial">
              {SCORES.map((score) => (
                <button
                  key={score}
                  aria-pressed={release.myScore === score}
                  aria-label={`Rate ${score} out of 10`}
                  disabled={busy}
                  onClick={() => void saveScore(score)}
                >
                  {score}
                </button>
              ))}
            </div>

            <input
              className="slider"
              type="range"
              min={1}
              max={10}
              step={0.05}
              value={current}
              disabled={busy}
              aria-label="Score out of 10"
              onChange={(e) => setDraft(Number(e.target.value))}
              onPointerUp={() => draft !== null && void saveScore(draft)}
              onKeyUp={() => draft !== null && void saveScore(draft)}
            />

            <div className="slider-scale">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {rated && (
            <div className="actions" style={{ marginTop: "1rem" }}>
              <button
                className="btn warn small"
                disabled={busy}
                onClick={() =>
                  void change(() => api.del(`/api/releases/${id}/rating`))
                }
              >
                Remove my score
              </button>
            </div>
          )}

          {notice && <p className="notice">{notice}</p>}
        </div>
      </div>

      {tracks.length > 0 && (
        <>
          <div className="section-rule">
            <h2>
              track by track
              {(good > 0 || bad > 0) && (
                <>
                  {" "}
                  · {good} kept · {bad} skipped
                </>
              )}
            </h2>
          </div>

          <p className="meta" style={{ marginTop: 0, marginBottom: "1rem" }}>
            Mark what earns its place on the album and what you would cut.
          </p>

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
                    title="Belongs here"
                    disabled={busy}
                    onClick={() => void setVerdict(track, "GOOD")}
                  >
                    ✓
                  </button>
                  <button
                    className="bad"
                    aria-pressed={track.myVerdict === "BAD"}
                    aria-label={`Cut ${track.title}`}
                    title="Would cut it"
                    disabled={busy}
                    onClick={() => void setVerdict(track, "BAD")}
                  >
                    ✕
                  </button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
