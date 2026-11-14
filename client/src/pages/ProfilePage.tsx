import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Sleeve from "../components/Sleeve";
import type { CurrentUser, Profile } from "../types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function since(iso: string | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function Skeleton() {
  return (
    <main className="page">
      <div className="profile-head">
        <div>
          <div
            className="skeleton"
            style={{ width: "14rem", height: "3rem", borderRadius: 2 }}
          />
          <div
            className="skeleton"
            style={{
              width: "10rem",
              height: "0.875rem",
              marginTop: "1rem",
              borderRadius: 2,
            }}
          />
        </div>
      </div>
      <div className="section">
        <h2>the record</h2>
      </div>
      <div className="sleeves">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton" style={{ aspectRatio: 1 }} />
        ))}
      </div>
    </main>
  );
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
    if (notice) {
      return (
        <main className="page">
          <h1 className="headline">That did not load</h1>
          <p className="notice">{notice}</p>
          <div className="actions" style={{ marginTop: "1.5rem" }}>
            <button className="btn" onClick={() => void load()}>
              Try again
            </button>
          </div>
        </main>
      );
    }
    return <Skeleton />;
  }

  const isSelf = profile.relationship === "self";
  const ratings = profile.ratings ?? [];
  const open = Boolean(profile.ratings);
  const average =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : null;

  const standing =
    profile.relationship === "friends"
      ? "friends"
      : profile.relationship === "pending_sent"
        ? "request sent"
        : profile.relationship === "pending_received"
          ? "wants to be friends"
          : null;

  return (
    <main className="page">
      <div className="profile-head">
        <div>
          <h1 className="headline">{profile.displayName}</h1>
          <p className="meta">
            @{profile.username}
            {standing && <> · {standing}</>}
            {profile.createdAt && <> · keeping score since {since(profile.createdAt)}</>}
          </p>
        </div>

        {open && ratings.length > 0 && (
          <div className="tally">
            <div>
              <b>{ratings.length}</b>
              rated
            </div>
            {average !== null && (
              <div>
                <b className="accent">{average.toFixed(2)}</b>
                average
              </div>
            )}
          </div>
        )}
      </div>

      {profile.bio && !editing && <p className="bio">{profile.bio}</p>}

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
            {busy ? "Sending…" : "Add friend"}
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
        <div style={{ maxWidth: "26rem", marginTop: "1.75rem" }}>
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
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button className="btn quiet" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="section">
        <h2>the record</h2>
      </div>

      {!open ? (
        <div className="blank">
          <p>This record is private.</p>
          <p>
            Only {profile.displayName}&rsquo;s friends can see what they rated.
          </p>
          {profile.relationship === "none" && (
            <button
              className="btn"
              disabled={busy}
              onClick={() =>
                void act(() =>
                  api.post("/api/friends/requests", {
                    target: profile.username,
                  }),
                )
              }
            >
              Send a friend request
            </button>
          )}
        </div>
      ) : ratings.length === 0 ? (
        <div className="blank">
          <p>
            {isSelf
              ? "Nothing on the record yet."
              : `${profile.displayName} has not rated anything yet.`}
          </p>
          {isSelf && (
            <>
              <p>Search for an album and give it a number.</p>
              <Link className="btn" to="/search">
                Find something to rate
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="sleeves">
          {ratings.map((rating, index) => (
            <Sleeve
              key={rating.id}
              index={index}
              to={`/releases/${rating.release.id}`}
              coverUrl={rating.release.coverUrl}
              title={rating.release.title}
              artist={rating.release.artist}
              year={rating.release.releaseYear}
              score={rating.score}
            />
          ))}
        </div>
      )}
    </main>
  );
}
