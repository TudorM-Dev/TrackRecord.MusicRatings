import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import Entry from "../components/Entry";
import type { MusicResult, Release } from "../types";

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicResult[]>([]);
  const [term, setTerm] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setNotice("");
    setBusy(true);
    try {
      const found = await api.get<MusicResult[]>(
        `/api/music/search?q=${encodeURIComponent(trimmed)}`,
      );
      setResults(found);
      setTerm(trimmed);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  async function open(result: MusicResult) {
    try {
      const release = await api.post<Release>("/api/releases", {
        externalId: result.externalId,
      });
      navigate(`/releases/${release.id}`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not open that one");
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">search</p>
      <h1 className="headline">What did you listen to?</h1>

      <form
        className="searchbar"
        onSubmit={search}
        style={{ marginTop: "1.75rem" }}
      >
        <input
          type="search"
          placeholder="Album or track"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Album or track"
        />
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Searching" : "Search"}
        </button>
      </form>

      {notice && <p className="notice">{notice}</p>}

      {results.length > 0 && (
        <>
          <div className="section-rule">
            <h2>
              {results.length} result{results.length === 1 ? "" : "s"}
            </h2>
          </div>
          <div className="record">
            {results.map((result, index) => (
              <Entry
                key={result.externalId}
                index={index}
                coverUrl={result.coverUrl}
                title={result.title}
                subtitle={`${result.artist}${result.releaseYear ? ` · ${result.releaseYear}` : ""}`}
                tag={result.kind}
                onClick={() => void open(result)}
              />
            ))}
          </div>
        </>
      )}

      {term && results.length === 0 && !busy && (
        <div className="blank" style={{ marginTop: "2rem" }}>
          <p>Nothing found for “{term}”.</p>
          <p>Try the artist name instead.</p>
        </div>
      )}
    </main>
  );
}
