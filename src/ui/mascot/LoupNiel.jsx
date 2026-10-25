// Loup Niel, la mascotte : une pose = un SVG (tutoriel, écrans de fin).

import { LOUP_SVG } from "./loupNielSprites.js";

const svgUrl = (pose) => `data:image/svg+xml;utf8,${encodeURIComponent(LOUP_SVG[pose] ?? LOUP_SVG.neutre)}`;

export function LoupNiel({ pose = "neutre", className = "" }) {
  return <img className={`loup ${className}`} src={svgUrl(pose)} alt="" draggable="false" />;
}
