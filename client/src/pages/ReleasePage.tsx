import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import type { ReleaseDetail } from "../types";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function ReleasePage() {
  const { id } = useParams();
  const [release, setRelease] = useState<ReleaseDetail | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRelease(await api.get<ReleaseDetail>(`/api/releases/${id}`));
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

  if (!release) {
    return <p className="loading">{notice || "Loading…"}</p>;
  }

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
            <h2>{release.myScore === null ? "rate it" : "your rating"}</h2>
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
                Remove my rating
              </button>
            </div>
          )}

          {notice && <p className="notice">{notice}</p>}
        </div>
      </div>
    </main>
  );
}
