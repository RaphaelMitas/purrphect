import type { ReactNode } from "react";

export function Prose({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-8 pb-20 sm:px-6 [&_a]:text-pink-ink [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-extrabold [&_h2]:text-2xl [&_li]:mt-1 [&_p]:mt-3 [&_p]:font-medium [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:font-medium">
      <h1 className="font-extrabold text-4xl sm:text-5xl">{title}</h1>
      {updated && <p className="text-foreground/70 text-sm">Last updated {updated}</p>}
      {children}
    </article>
  );
}
