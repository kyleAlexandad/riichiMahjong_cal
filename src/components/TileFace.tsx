import type { TileId } from "../types/tiles";

const HONOR: Record<string, string> = {
  "1z": "東",
  "2z": "南",
  "3z": "西",
  "4z": "北",
  "5z": "白",
  "6z": "發",
  "7z": "中",
};

function label(tile: TileId): string {
  if (tile.endsWith("z")) return HONOR[tile] ?? tile;
  return tile[0] ?? "";
}

export function TileFace({
  tile,
  open = false,
  winning = false,
  isAka = false,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  small,
}: {
  tile: TileId;
  open?: boolean;
  winning?: boolean;
  isAka?: boolean;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
  small?: boolean;
}) {
  const suit = tile[1] as "m" | "p" | "s" | "z";
  const suitClass = suit === "m" ? "suit-m" : suit === "p" ? "suit-p" : suit === "s" ? "suit-s" : "suit-z";
  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        "tile-face",
        suitClass,
        open ? "tile-open" : "",
        winning ? "tile-win" : "",
        isAka ? "tile-aka" : "",
        small ? "tile-sm" : "",
        "haptic",
      ].join(" ")}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <span className="tile-lbl">{label(tile)}</span>
      {isAka && <span className="tile-aka-dot" />}
    </div>
  );
}

export function TileKey({
  tile,
  onAdd,
  suitClass,
}: {
  tile: TileId;
  onAdd: () => void;
  suitClass: string;
}) {
  return (
    <button
      type="button"
      className={["tile-key", suitClass, "haptic"].join(" ")}
      onClick={onAdd}
    >
      {label(tile)}
    </button>
  );
}
