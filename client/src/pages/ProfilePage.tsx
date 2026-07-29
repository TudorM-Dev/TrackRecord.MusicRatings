import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Entry from "../components/Entry";
import type { CurrentUser, Profile } from "../types";

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

function since(iso: string | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export default function ProfilePage() {
  const params = useParams();
  const { user, setUser } = useAuth();
  const username = params.username ?? user?.username;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const load = useCallback(async () => {
    if (!username) return;
    setNotice("");
    try {
      const data = await api.get<Profile>(`/api/users/${username}`);
      setProfile(data);
      setDisplayName(data.displayName);
      setBio(data.bio ?? "");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load profile");
    }
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(action: () => Promise<unknown>) {
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

  async function save() {
    setBusy(true);
    try {
      const updated = await api.patch<CurrentUser>("/api/users/me", {
        displayName,
        bio,
      });
      setUser(updated);
      setEditing(false);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return <p className="loading">{notice || "Loading…"}</p>;
  }

  const isSelf = profile.relationship === "self";
  const ratings = profile.ratings ?? [];
  const average =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : null;

  return (
    <main className="page">
      <p className="eyebrow">
        {isSelf ? "your record" : `@${profile.username}`}
      </p>
      <h1 className="headline">{profile.displayName}</h1>

      <p className="meta">
        {isSelf && <>@{profile.username} · </>}
        {profile.relationship === "friends" && <>friends · </>}
        {profile.relationship === "pending_sent" && <>request sent · </>}
        {profile.relationship === "pending_received" && (
          <>wants to be friends · </>
        )}
        {/* counts only exist when the server let us see the ratings */}
        {profile.ratings ? (
          <>
            <b>{ratings.length}</b> rated
            {average !== null && (
              <>
                {" · avg "}
                <b>{average.toFixed(1)}</b>
              </>
            )}
          </>
        ) : (
          <>private record</>
        )}
        {profile.createdAt && <> · since {since(profile.createdAt)}</>}
      </p>

      {profile.bio && <p style={{ maxWidth: "38rem" }}>{profile.bio}</p>}

      {notice && <p className="notice">{notice}</p>}

      <div className="actions" style={{ marginTop: "1.5rem" }}>
        {isSelf && !editing && (
          <button className="btn quiet small" onClick={() => setEditing(true)}>
            Edit profile
          </button>
        )}

        {profile.relationship === "none" && (
          <button
            className="btn small"
            disabled={busy}
            onClick={() =>
              void act(() =>
                api.post("/api/friends/requests", { target: profile.username }),
              )
            }
          >
            Add friend
          </button>
        )}

        {profile.relationship === "pending_received" && (
          <Link className="btn small" to="/friends">
            Answer request
          </Link>
        )}

        {(profile.relationship === "friends" ||
          profile.relationship === "pending_sent") && (
          <button
            className="btn warn small"
            disabled={busy}
            onClick={() =>
              void act(() => api.del(`/api/friends/${profile.username}`))
            }
          >
            {profile.relationship === "friends"
              ? "Remove friend"
              : "Cancel request"}
          </button>
        )}
      </div>

      {editing && (
        <div style={{ maxWidth: "26rem", marginTop: "1.5rem" }}>
          <label className="field">
            <span>Display name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Bio</span>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What are you listening to lately?"
            />
          </label>
          <div className="actions">
            <button className="btn" disabled={busy} onClick={() => void save()}>
              Save changes
            </button>
            <button className="btn quiet" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {profile.ratings ? (
        <>
          <div className="section-rule">
            <h2>{isSelf ? "the record" : "rated"}</h2>
          </div>

          {ratings.length === 0 ? (
            <div className="blank">
              <p>
                {isSelf
                  ? "Nothing on the record yet."
                  : "Nothing rated yet."}
              </p>
              {isSelf && (
                <Link className="btn" to="/search">
                  Find something to rate
                </Link>
              )}
            </div>
          ) : (
            <div className="record">
              {ratings.map((rating, index) => (
                <Entry
                  key={rating.id}
                  index={index}
                  score={rating.score}
                  coverUrl={rating.release.coverUrl}
                  title={rating.release.title}
                  subtitle={`${rating.release.artist} · ${rating.release.releaseYear}`}
                  tag={rating.release.kind}
                  to={`/releases/${rating.release.id}`}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="section-rule">
            <h2>the record</h2>
          </div>
          <div className="blank">
            <p>This record is private.</p>
            <p>Become friends to see what {profile.displayName} has rated.</p>
          </div>
        </>
      )}
    </main>
  );
}
