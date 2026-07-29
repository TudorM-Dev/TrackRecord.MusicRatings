import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { FriendRequest, PublicUser } from "../types";

export default function FriendsPage() {
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [username, setUsername] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

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
      <p className="eyebrow">friends</p>
      <h1 className="headline">Who else is keeping score?</h1>

      <form
        className="searchbar"
        onSubmit={send}
        style={{ marginTop: "1.75rem" }}
      >
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-label="Username"
        />
        <button className="btn" type="submit" disabled={busy}>
          Send request
        </button>
      </form>

      {notice && <p className="notice">{notice}</p>}

      {received.length > 0 && (
        <>
          <div className="section-rule">
            <h2>waiting for you</h2>
          </div>
          <div className="people">
            {received.map((request, index) => (
              <div
                key={request.id}
                className="person"
                style={{ animationDelay: `${index * 28}ms` }}
              >
                <div>
                  <Link
                    className="person-name"
                    to={`/users/${request.requester?.username}`}
                  >
                    {request.requester?.displayName}
                  </Link>
                  <div className="person-handle">
                    @{request.requester?.username}
                  </div>
                </div>
                <div className="actions">
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
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {sent.length > 0 && (
        <>
          <div className="section-rule">
            <h2>waiting on them</h2>
          </div>
          <div className="people">
            {sent.map((request, index) => (
              <div
                key={request.id}
                className="person"
                style={{ animationDelay: `${index * 28}ms` }}
              >
                <div>
                  <Link
                    className="person-name"
                    to={`/users/${request.receiver?.username}`}
                  >
                    {request.receiver?.displayName}
                  </Link>
                  <div className="person-handle">
                    @{request.receiver?.username}
                  </div>
                </div>
                <div className="actions">
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
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-rule">
        <h2>{friends.length} friend{friends.length === 1 ? "" : "s"}</h2>
      </div>

      {friends.length === 0 ? (
        <div className="blank">
          <p>No friends yet.</p>
          <p>Send a request above to compare records.</p>
        </div>
      ) : (
        <div className="people">
          {friends.map((friend, index) => (
            <Link
              key={friend.id}
              className="person"
              to={`/users/${friend.username}`}
              style={{ animationDelay: `${index * 28}ms` }}
            >
              <div>
                <div className="person-name">{friend.displayName}</div>
                <div className="person-handle">@{friend.username}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
