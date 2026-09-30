import Link from "next/link";
import { DesignIcon } from "./design-icon";
export function Logo() {
  return (
    <Link
      href="/notes"
      className="inline-flex items-center gap-3 text-lg font-bold"
      aria-label="NoteVault home"
    >
      <span className="gradient-button flex size-9 items-center justify-center rounded-lg">
        <DesignIcon name="pen" />
      </span>
      NoteVault
    </Link>
  );
}
