/* Figma icons keep their original SVG dimensions. */
export function DesignIcon({ name }: { name: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/figma/${name}.svg`} alt="" className="shrink-0" />;
}
