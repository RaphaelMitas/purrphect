import { APP_STORE, PLAY_STORE, type Store } from "@/links";

const BADGE = "flex h-14 flex-col justify-center rounded-2xl px-4 leading-tight sm:min-w-44 sm:px-5";

function Badge({ store }: { store: Store }) {
  if (!store.href) {
    return (
      <div className={`${BADGE} border-2 border-foreground/20 border-dashed text-foreground/70`}>
        <span className="text-xs">Coming soon to</span>
        <span className="font-extrabold text-lg">{store.name}</span>
      </div>
    );
  }
  return (
    <a
      href={store.href}
      className={`${BADGE} bg-foreground text-background transition-transform hover:-translate-y-0.5`}
    >
      <span className="text-xs">{store.kicker}</span>
      <span className="font-extrabold text-lg">{store.name}</span>
    </a>
  );
}

export function StoreBadges() {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
      <Badge store={APP_STORE} />
      <Badge store={PLAY_STORE} />
    </div>
  );
}
