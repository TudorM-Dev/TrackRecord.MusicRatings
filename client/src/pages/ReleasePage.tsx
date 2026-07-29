import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import type { ReleaseDetail, Track, Verdict } from "../types";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function ReleasePage() {
  const { id } = useParams();
  const [release, setRelease] = useState<ReleaseDetail | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
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

  // Clicking the verdict you already gave removes it, like a toggle.
  function setVerdict(track: Track, verdict: Verdict) {
    const url = `/api/releases/${id}/tracks/${track.id}/verdict`;
    return change(() =>
      track.myVerdict === verdict
        ? api.del(url)
        : api.put(url, { verdict }),
    );
  }

  if (!release) {
    return <p className="loading">{notice || "Loading…"}</p>;
  }

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
            {release.releaseYear}
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
                  {release.averageScore.toFixed(1)}
                </span>
                <span className="meta" style={{ margin: 0 }}>
                  from {release.ratingCount}{" "}
                  {release.ratingCount === 1 ? "rating" : "ratings"}
                </span>
              </>
            )}
          </div>

          <div className="section-rule" style={{ marginTop: "2.5rem" }}>
            <h2>{release.myScore === null ? "rate the album" : "your score"}</h2>
          </div>

          <div className="dial">
            {SCORES.map((score) => (
              <button
                key={score}
                aria-pressed={release.myScore === score}
                aria-label={`Rate ${score} out of 10`}
                disabled={busy}
                onClick={() =>
                  void change(() =>
                    api.put(`/api/releases/${id}/rating`, { score }),
                  )
                }
              >
                {score}
              </button>
            ))}
          </div>

          {release.myScore !== null && (
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
                <> · {good} kept · {bad} skipped</>
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
