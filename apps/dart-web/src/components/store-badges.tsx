import Image from "next/image";
import { APP_STORE_URL } from "@/links";

const BADGE_WIDTH = 168;
const BADGE_HEIGHT = 56;

function AppStoreBadge({ color, className }: { color: "black" | "white"; className: string }) {
  return (
    <Image
      src={`/badges/app-store-${color}.svg`}
      alt="Download on the App Store"
      width={BADGE_WIDTH}
      height={BADGE_HEIGHT}
      unoptimized
      className={`h-14 w-auto ${className}`}
    />
  );
}

export function StoreBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={APP_STORE_URL}
        data-event="Download"
        data-event-via="app-store"
        className="transition-transform hover:-translate-y-0.5"
      >
        <AppStoreBadge color="black" className="dark:hidden" />
        <AppStoreBadge color="white" className="hidden dark:block" />
      </a>
      <div className="flex h-14 flex-col justify-center rounded-2xl border-2 border-foreground/20 border-dashed px-4 text-foreground/70 leading-tight sm:min-w-44 sm:px-5">
        <span className="text-xs">Coming soon to</span>
        <span className="font-extrabold text-lg">Google Play</span>
      </div>
    </div>
  );
}
