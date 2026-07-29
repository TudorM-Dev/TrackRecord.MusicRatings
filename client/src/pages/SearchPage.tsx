import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isAbort } from "../api";
import Entry from "../components/Entry";
import type { MusicResult, Release } from "../types";

const MIN_LENGTH = 2;
const DEBOUNCE_MS = 300;

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicResult[]>([]);
  const [term, setTerm] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_LENGTH) {
      setResults([]);
      setTerm("");
      setBusy(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setBusy(true);
      setNotice("");
      try {
        const found = await api.get<MusicResult[]>(
          `/api/music/search?q=${encodeURIComponent(trimmed)}`,
          controller.signal,
        );
        setResults(found);
        setTerm(trimmed);
      } catch (err) {
        if (isAbort(err)) return;
        setNotice(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

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

  const empty = term && results.length === 0 && !busy;

  return (
    <main className="page">
      <p className="eyebrow">search</p>
      <h1 className="headline">What did you listen to?</h1>

      <div className="searchbar" style={{ marginTop: "1.75rem" }}>
        <input
          type="search"
          placeholder="Album or track"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Album or track"
          autoFocus
        />
      </div>

      {notice && <p className="notice">{notice}</p>}

      {(results.length > 0 || busy) && (
        <div className="section-rule">
          <h2>
            {busy
              ? "searching"
              : `${results.length} result${results.length === 1 ? "" : "s"}`}
          </h2>
        </div>
      )}

      {results.length > 0 && (
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
      )}

      {empty && (
        <div className="blank" style={{ marginTop: "2rem" }}>
          <p>Nothing found for “{term}”.</p>
          <p>Try the artist name instead.</p>
        </div>
      )}
    </main>
  );
}
