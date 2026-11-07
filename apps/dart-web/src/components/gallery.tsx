"use client";

import Image from "next/image";
import { useState } from "react";
import { Cat } from "@/components/cat";
import type { DeviceShots } from "@/screenshots";

function Placeholder() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-border border-dashed px-6 py-16 text-center">
      <Cat size={64} className="opacity-80" />
      <p className="font-extrabold text-xl">Screenshots are on their way</p>
      <p className="max-w-sm text-foreground/70">The cat is still posing. Check back soon.</p>
    </div>
  );
}

export function Gallery({ devices }: { devices: DeviceShots[] }) {
  const [active, setActive] = useState(devices[0]?.device);
  const current = devices.find((d) => d.device === active) ?? devices[0];
  if (!current) return <Placeholder />;

  return (
    <div className="flex flex-col gap-6">
      {devices.length > 1 && (
        <div className="flex flex-wrap gap-1 self-start rounded-2xl bg-muted p-1">
          {devices.map((d) => (
            <button
              key={d.device}
              type="button"
              aria-pressed={d.device === current.device}
              onClick={() => setActive(d.device)}
              className="rounded-xl px-4 py-2 font-bold text-foreground/70 text-sm transition-colors hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm"
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {current.shots.map((shot) => (
          <li key={shot.src} className="shrink-0 snap-center">
            <figure className="flex flex-col items-center gap-3">
              <Image
                src={shot.src}
                alt={shot.caption}
                width={shot.width}
                height={shot.height}
                className="h-auto max-h-[32rem] w-auto max-w-[80vw]"
              />
              <figcaption className="max-w-64 text-center text-foreground/70 text-sm">{shot.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
