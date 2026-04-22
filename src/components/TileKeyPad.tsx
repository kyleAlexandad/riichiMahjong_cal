import type { ReactNode } from "react";
import { TileKey } from "./TileFace";
import type { TileId } from "../types/tiles";

const NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const HONOR_TILES: TileId[] = ["1z", "2z", "3z", "4z", "5z", "6z", "7z"];
const AKA5 = ["5m", "5p", "5s"] as const;

type PickOpts = { aka?: boolean };

/**
 * 与「牌山」相同：三花色各一行 + 字牌一行 + 赤5 一行
 */
export function TileKeyPad({
  onTile,
  akaLabel,
  beforeAkaRow,
  hideAkaRow,
}: {
  onTile: (id: TileId, opts?: PickOpts) => void;
  /** 不填则 赤5 按钮显示 赤m / 赤p / 赤s */
  akaLabel?: (id: "5m" | "5p" | "5s") => string;
  /** 插在字牌行与赤5行之间（如牌山「赤5+」说明） */
  beforeAkaRow?: ReactNode;
  /** 不显示赤5 行（宝牌区指示不需要区分赤） */
  hideAkaRow?: boolean;
}) {
  return (
    <>
      {(["m", "p", "s"] as const).map((s) => (
        <div key={s} className="suit-row">
          {NUMS.map((n) => {
            const id = `${n}${s}` as TileId;
            return (
              <TileKey
                key={id}
                tile={id}
                suitClass={s === "m" ? "suit-m" : s === "p" ? "suit-p" : "suit-s"}
                onAdd={() => onTile(id)}
              />
            );
          })}
        </div>
      ))}
      <div className="suit-row">
        {HONOR_TILES.map((id) => (
          <TileKey
            key={id}
            tile={id}
            suitClass="suit-z"
            onAdd={() => onTile(id)}
          />
        ))}
      </div>
      {beforeAkaRow}
      {!hideAkaRow && (
      <div className="suit-row aka-row">
        {AKA5.map((id) => (
          <button
            key={id}
            type="button"
            className="tile-key suit-aka haptic"
            onClick={() => onTile(id, { aka: true })}
          >
            {akaLabel
              ? akaLabel(id)
              : `赤${id.endsWith("m") ? "m" : id.endsWith("p") ? "p" : "s"}`}
          </button>
        ))}
      </div>
      )}
    </>
  );
}
