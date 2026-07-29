import { Link } from "react-router-dom";
import type { CSSProperties, ReactNode } from "react";

type EntryProps = {
  score?: number | null;
  coverUrl: string;
  title: string;
  subtitle: string;
  tag?: string;
  to?: string;
  onClick?: () => void;
  index?: number;
};

function Inner({
  score,
  coverUrl,
  title,
  subtitle,
  tag,
}: Omit<EntryProps, "to" | "onClick" | "index">) {
  return (
    <>
      <span
        className="score"
        style={
          {
            "--weight": (score ?? 0) / 10,
            fontWeight: score ? 400 + Math.round((score / 10) * 500) : 400,
          } as CSSProperties
        }
      >
        {score ?? "–"}
      </span>
      <img
        className="cover"
        src={coverUrl || undefined}
        alt=""
        loading="lazy"
      />
      <span className="entry-body">
        <span className="entry-title">{title}</span>
        <span className="entry-sub">{subtitle}</span>
      </span>
      {tag && <span className="tag">{tag}</span>}
    </>
  );
}

export default function Entry({ to, onClick, index = 0, ...rest }: EntryProps) {
  const style = { animationDelay: `${Math.min(index, 12) * 28}ms` };
  const content: ReactNode = <Inner {...rest} />;

  if (to) {
    return (
      <Link className="entry" to={to} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button className="entry" onClick={onClick} style={style}>
      {content}
    </button>
  );
}
