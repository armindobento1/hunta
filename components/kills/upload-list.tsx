import type { UploadProgressItem } from "./types";

export function UploadList({ items }: { items: UploadProgressItem[] }) {
  if (!items.length) return null;
  return (
    <div className="upload-list" aria-live="polite">
      {items.map((item) => (
        <div key={item.id}>
          <span>{item.name}</span>
          <progress max="100" value={item.percent} />
          <strong>{item.status === "error" ? "Failed" : `${Math.round(item.percent)}%`}</strong>
        </div>
      ))}
    </div>
  );
}
