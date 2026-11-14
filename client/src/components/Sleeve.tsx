import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { formatScoreShort } from "../format";
import { useTint } from "../tint";

type SleeveProps = {
  to: string;
  coverUrl: string;
  title: string;
  artist: string;
  year?: number;
  score?: number | null;
  index?: number;
  showName?: boolean;
  pending?: boolean;
  onOpen?: () => void;
};

export default function Sleeve({
  to,
  coverUrl,
  title,
  artist,
  year,
  score,
  index = 0,
  showName = false,
  pending = false,
  onOpen,
}: SleeveProps) {
  const tint = useTint(coverUrl);

  const style = {
    "--tint": tint,
    animationDelay: `${Math.min(index, 11) * 35}ms`,
  } as CSSProperties;

  const inner = (
    <>
      <img
        src={coverUrl || undefined}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span className="sleeve-name">
        <b>{title}</b>
        <span>
          {artist}
          {year ? ` · ${year}` : ""}
        </span>
      </span>
      {score !== null && score !== undefined && (
        <span className="sleeve-score">{formatScoreShort(score)}</span>
      )}
      {pending && <span className="sleeve-pending">Opening…</span>}
    </>
  );

  const className = "sleeve" + (showName ? " is-plain" : "");

  if (onOpen) {
    return (
      <button
        type="button"
        className={className}
        style={style}
        onClick={onOpen}
        aria-label={`${title} by ${artist}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link className={className} to={to} style={style}>
      {inner}
    </Link>
  );
}
