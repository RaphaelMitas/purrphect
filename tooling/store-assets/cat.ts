import {
  CHEEKS_X,
  EYES_X,
  HEAD,
  HEAD_TRANSFORM,
  NOSE,
  VIEW_BOX,
  WHISKER_SIDES,
  WHISKERS,
} from "@purrphect/ui/cat-paths";

const DETAIL = "#FFFFFF";
const BLUSH = "#FFB3CD";

export function catSvg(color: string): string {
  const whiskers = WHISKERS.map(
    (w) => `<path d="${w.d}" fill="${color}"${w.transform ? ` transform="${w.transform}"` : ""}/>`,
  ).join("");
  const eye = (x: number) =>
    `<g transform="translate(${x}, 79.4965)"><ellipse cx="14.5" cy="13.5" rx="14.5" ry="13.5" fill="${DETAIL}"/><circle cx="18.5" cy="12.5" r="3.5" fill="${color}"/></g>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW_BOX}">`,
    ...WHISKER_SIDES.map((t) => `<g transform="${t}">${whiskers}</g>`),
    `<path d="${HEAD}" fill="${color}" transform="${HEAD_TRANSFORM}"/>`,
    ...CHEEKS_X.map((x) => `<ellipse cx="${x}" cy="122" rx="12" ry="7" fill="${BLUSH}" opacity="0.8"/>`),
    ...EYES_X.map(eye),
    `<path d="${NOSE}" fill="${DETAIL}"/>`,
    "</svg>",
  ].join("");
}
