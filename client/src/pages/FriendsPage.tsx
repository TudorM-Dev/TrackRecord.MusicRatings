import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { FriendRequest, PublicUser } from "../types";

function initialOf(name: string | undefined) {
  return (name ?? "?").trim().charAt(0) || "?";
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [username, setUsername] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [friendList, incoming, outgoing] = await Promise.all([
        api.get<PublicUser[]>("/api/friends"),
        api.get<FriendRequest[]>("/api/friends/requests"),
        api.get<FriendRequest[]>("/api/friends/requests/sent"),
      ]);
      setFriends(friendList);
      setReceived(incoming);
      setSent(outgoing);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load friends");
    } finally {
      setLoading(false);
    }
  }, []);

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

  async function send(event: FormEvent) {
    event.preventDefault();
    const target = username.trim();
    if (!target) return;
    await act(() => api.post("/api/friends/requests", { target }));
    setUsername("");
  }

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1>Friends</h1>
          <p className="meta">
            {loading
              ? "Loading…"
              : friends.length === 0
                ? "Only accepted friends can open your record."
                : `${friends.length} ${friends.length === 1 ? "person" : "people"} can see your record.`}
          </p>
        </div>
      </div>

      <form className="finder" onSubmit={send}>
        <input
          placeholder="Add someone by username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-label="Add someone by username"
        />
        <button
          type="submit"
          className="finder-clear"
          disabled={busy || !username.trim()}
          aria-label="Send friend request"
          style={{ opacity: username.trim() ? 1 : 0.4 }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </button>
      </form>

      {notice && <p className="notice">{notice}</p>}

      {received.length > 0 && (
        <>
          <div className="section">
            <h2>waiting for you</h2>
          </div>
          <div className="requests">
            {received.map((request, index) => (
              <div
                key={request.id}
                className="request"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <span className="initial" aria-hidden="true">
                  {initialOf(request.requester?.displayName)}
                </span>
                <span className="card-person-body">
                  <Link
                    to={`/users/${request.requester?.username}`}
                    style={{ fontWeight: 600 }}
                  >
                    {request.requester?.displayName}
                  </Link>
                  <span style={{ display: "block" }}>
                    @{request.requester?.username}
                  </span>
                </span>
                <span className="actions">
                  <button
                    className="btn small"
                    disabled={busy}
                    onClick={() =>
                      void act(() =>
                        api.post(`/api/friends/requests/${request.id}/accept`),
                      )
                    }
                  >
                    Accept
                  </button>
                  <button
                    className="btn quiet small"
                    disabled={busy}
                    onClick={() =>
                      void act(() =>
                        api.post(`/api/friends/requests/${request.id}/decline`),
                      )
                    }
                  >
                    Decline
                  </button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {sent.length > 0 && (
        <>
          <div className="section">
            <h2>waiting on them</h2>
          </div>
          <div className="requests">
            {sent.map((request, index) => (
              <div
                key={request.id}
                className="request"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <span className="initial" aria-hidden="true">
                  {initialOf(request.receiver?.displayName)}
                </span>
                <span className="card-person-body">
                  <Link
                    to={`/users/${request.receiver?.username}`}
                    style={{ fontWeight: 600 }}
                  >
                    {request.receiver?.displayName}
                  </Link>
                  <span style={{ display: "block" }}>
                    @{request.receiver?.username}
                  </span>
                </span>
                <span className="actions">
                  <button
                    className="btn quiet small"
                    disabled={busy}
                    onClick={() =>
                      void act(() =>
                        api.del(`/api/friends/${request.receiver?.username}`),
                      )
                    }
                  >
                    Cancel
                  </button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section">
        <h2>
          {friends.length} friend{friends.length === 1 ? "" : "s"}
        </h2>
      </div>

      {loading ? (
        <div className="cards">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "4.5rem", borderRadius: 2 }}
            />
          ))}
        </div>
      ) : friends.length === 0 ? (
        <div className="blank">
          <p>Nobody can see your record yet.</p>
          <p>
            Add someone by username above. They have to accept before either of
            you can open the other&rsquo;s profile.
          </p>
        </div>
      ) : (
        <div className="cards">
          {friends.map((friend, index) => (
            <Link
              key={friend.id}
              className="card-person"
              to={`/users/${friend.username}`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <span className="initial" aria-hidden="true">
                {initialOf(friend.displayName)}
              </span>
              <span className="card-person-body">
                <b>{friend.displayName}</b>
                <span>@{friend.username}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
