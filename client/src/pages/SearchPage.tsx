import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isAbort } from "../api";
import Sleeve from "../components/Sleeve";
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
  const [opening, setOpening] = useState("");

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
    setOpening(result.externalId);
    setNotice("");
    try {
      const release = await api.post<Release>("/api/releases", {
        externalId: result.externalId,
      });
      navigate(`/releases/${release.id}`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not open that one");
      setOpening("");
    }
  }

  const empty = term && results.length === 0 && !busy;
  const idle = query.trim().length < MIN_LENGTH;

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1>Search</h1>
          <p className="meta">Albums and singles, straight from the catalogue.</p>
        </div>
      </div>

      <div className="finder">
        <input
          type="search"
          placeholder="Album, single or artist"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Album, single or artist"
          autoFocus
        />
        {busy && <span className="finder-status">searching</span>}
        {query && (
          <button
            type="button"
            className="finder-clear"
            aria-label="Clear search"
            onClick={() => setQuery("")}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              aria-hidden="true"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>

      {notice && <p className="notice">{notice}</p>}

      {idle && (
        <div className="blank" style={{ marginTop: "2.5rem" }}>
          <p>Type at least two letters.</p>
          <p>Artist names work better than album titles.</p>
        </div>
      )}

      {!idle && results.length > 0 && (
        <>
          <div className="section">
            <h2>
              {results.length} result{results.length === 1 ? "" : "s"}
              {term && ` for “${term}”`}
            </h2>
          </div>

          <div className="sleeves">
            {results.map((result, index) => (
              <Sleeve
                key={result.externalId}
                index={index}
                to=""
                onOpen={() => void open(result)}
                coverUrl={result.coverUrl}
                title={result.title}
                artist={result.artist}
                year={result.releaseYear}
                showName
                pending={opening === result.externalId}
              />
            ))}
          </div>
        </>
      )}

      {empty && (
        <div className="blank" style={{ marginTop: "2.5rem" }}>
          <p>Nothing found for “{term}”.</p>
          <p>Try the artist name on its own.</p>
        </div>
      )}
    </main>
  );
}
