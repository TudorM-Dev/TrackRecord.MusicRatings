import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import type { AdminRelease, AdminStats, AdminUser } from "../types";

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [releases, setReleases] = useState<AdminRelease[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, u, r] = await Promise.all([
        api.get<AdminStats>("/api/admin/stats"),
        api.get<AdminUser[]>("/api/admin/users"),
        api.get<AdminRelease[]>("/api/admin/releases"),
      ]);
      setStats(s);
      setUsers(u);
      setReleases(r);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load data");
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

  if (!stats) {
    return <p className="loading">{notice || "Loading…"}</p>;
  }

  return (
    <main className="page">
      <p className="eyebrow">admin</p>
      <h1 className="headline">Everything, from above</h1>

      {notice && <p className="notice">{notice}</p>}

      <div className="section-rule">
        <h2>numbers</h2>
      </div>

      <div className="stats">
        <Stat value={stats.users} label="users" />
        <Stat value={stats.releases} label="releases" />
        <Stat value={stats.tracks} label="tracks" />
        <Stat value={stats.ratings} label="ratings" />
        <Stat value={stats.verdicts} label="verdicts" />
        <Stat value={stats.friendships} label="friendships" />
        <Stat value={stats.pendingRequests} label="pending" />
        <Stat
          value={stats.averageScore === null ? "–" : stats.averageScore.toFixed(1)}
          label="avg score"
        />
      </div>

      <div className="section-rule">
        <h2>{users.length} users</h2>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Ratings</th>
              <th>Verdicts</th>
              <th>Sessions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((row) => (
              <tr key={row.id}>
                <td className="grow">
                  <Link to={`/users/${row.username}`}>{row.displayName}</Link>
                  <div className="person-handle">@{row.username}</div>
                </td>
                <td>{row.email}</td>
                <td>
                  <span
                    className={row.role === "ADMIN" ? "pill admin" : "pill"}
                  >
                    {row.role.toLowerCase()}
                  </span>
                </td>
                <td>{row._count.ratings}</td>
                <td>{row._count.verdicts}</td>
                <td>{row._count.sessions}</td>
                <td>
                  <div className="actions">
                    {row.id !== user?.id && (
                      <>
                        <button
                          className="btn quiet small"
                          disabled={busy}
                          onClick={() =>
                            void act(() =>
                              api.patch(`/api/admin/users/${row.id}/role`, {
                                role: row.role === "ADMIN" ? "USER" : "ADMIN",
                              }),
                            )
                          }
                        >
                          {row.role === "ADMIN" ? "Demote" : "Make admin"}
                        </button>
                        <button
                          className="btn warn small"
                          disabled={busy}
                          onClick={() => {
                            if (
                              confirm(
                                `Delete ${row.username} and everything they rated?`,
                              )
                            ) {
                              void act(() =>
                                api.del(`/api/admin/users/${row.id}`),
                              );
                            }
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-rule">
        <h2>{releases.length} releases</h2>
      </div>

      {releases.length === 0 ? (
        <div className="blank">
          <p>No releases saved yet.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Release</th>
                <th>Year</th>
                <th>Kind</th>
                <th>Ratings</th>
                <th>Tracks</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {releases.map((row) => (
                <tr key={row.id}>
                  <td className="grow">
                    <Link to={`/releases/${row.id}`}>{row.title}</Link>
                    <div className="person-handle">{row.artist}</div>
                  </td>
                  <td>{row.releaseYear || "–"}</td>
                  <td>
                    <span className="pill">{row.kind.toLowerCase()}</span>
                  </td>
                  <td>{row._count.ratings}</td>
                  <td>{row._count.tracks}</td>
                  <td>
                    <button
                      className="btn warn small"
                      disabled={busy}
                      onClick={() => {
                        if (confirm(`Delete "${row.title}" and its ratings?`)) {
                          void act(() =>
                            api.del(`/api/admin/releases/${row.id}`),
                          );
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
