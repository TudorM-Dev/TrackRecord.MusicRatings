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
};

export default function Sleeve({
  to,
  coverUrl,
  title,
  artist,
  year,
  score,
  index = 0,
}: SleeveProps) {
  const tint = useTint(coverUrl);

  const style = {
    "--tint": tint,
    animationDelay: `${Math.min(index, 11) * 35}ms`,
  } as CSSProperties;

  return (
    <Link className="sleeve" to={to} style={style}>
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
    </Link>
  );
}
