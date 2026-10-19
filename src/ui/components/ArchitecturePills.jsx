import { frNumber } from "../../domain/index.js";

/** Base d'une architecture : « 10 ⚡ × 2 ». */
export function ArchitecturePills({ compute, scale }) {
  return (
    <>
      <span className="pill c">{compute} ⚡</span>
      <span className="pill s">× {frNumber(scale)}</span>
    </>
  );
}
