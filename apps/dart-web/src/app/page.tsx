import Link from "next/link";
import type { ReactNode } from "react";
import { Cat } from "@/components/cat";
import { Chip } from "@/components/chip";
import { Gallery } from "@/components/gallery";
import { StoreBadges } from "@/components/store-badges";
import { REPO_URL } from "@/links";
import { loadScreenshots } from "@/screenshots";

const FEATURES: { title: string; body: string; badge: ReactNode }[] = [
  {
    title: "Room for the whole crew",
    body: "Up to 12 players in one match. The queue shows who's up next, so nobody has to ask.",
    badge: <Chip tone="treble">12</Chip>,
  },
  {
    title: "Board or tiles",
    body: "Tap where the dart landed on the board, or punch it in on big tiles. Switch whenever you like.",
    badge: <Chip tone="double">T20</Chip>,
  },
  {
    title: "The cat calls the out",
    body: "Every visit, the cat suggests a checkout and your odds of hitting it. Miss a dart and it has a plan B.",
    badge: <Cat size={40} />,
  },
  {
    title: "Stats with heatmaps",
    body: "Averages, checkout rates, doubles and a heatmap of where your darts really land.",
    badge: <Chip tone="bull">180</Chip>,
  },
  {
    title: "Kitten to Purrphect",
    body: "Legs, tons and 180s earn XP. Ten levels to climb, and yes, one of them is Whisker Wizard.",
    badge: <Chip tone="treble">Lv 10</Chip>,
  },
  {
    title: "Light and dark",
    body: "Follows your device. Bright for the garden, dim for the pub.",
    badge: (
      <span className="size-10 rounded-full border-2 border-border bg-linear-to-r from-50% from-butter-soft to-50% to-foreground" />
    ),
  },
];

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mx-auto max-w-6xl scroll-mt-8 px-4 py-16 sm:px-6">
      <h2 id={`${id}-title`} className="font-extrabold text-3xl sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-3 max-w-xl text-lg text-foreground/70">{intro}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

function CatBubble() {
  return (
    <figure className="flex flex-col items-center gap-6">
      <Cat size={220} className="h-auto w-32 motion-safe:animate-bob sm:w-56" />
      <figcaption className="relative flex flex-wrap items-center justify-center gap-2 rounded-3xl bg-card px-5 py-4 text-lg shadow-pink/10 shadow-xl">
        <span
          aria-hidden="true"
          className="-top-2 -translate-x-1/2 absolute left-1/2 size-4 rotate-45 rounded-sm bg-card"
        />
        81 left. Go
        <Chip tone="treble">T19</Chip>
        <Chip tone="double">D12</Chip>
        <span className="font-extrabold text-pink-ink">21%</span>
      </figcaption>
    </figure>
  );
}

export default async function Home() {
  const screenshots = await loadScreenshots();
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-8 pb-16 sm:px-6 md:grid-cols-[1.2fr_1fr] md:pt-16">
        <div className="flex flex-col items-start gap-6">
          <p className="rounded-full bg-pink-soft px-3 py-1 font-bold text-pink-ink text-sm">
            Darts scoring for iPad, iPhone and Android
          </p>
          <h1 className="font-extrabold text-[2.5rem] leading-[1.05] tracking-tight sm:text-6xl">
            Darts night,
            <br />
            <span className="text-pink-ink">purrfectly scored.</span>
          </h1>
          <p className="max-w-lg text-lg text-foreground/70 sm:text-xl">
            One iPad on the wall, up to 12 players, and a cat who knows every checkout. No sign up, no ads, no fuss.
          </p>
          <StoreBadges />
        </div>
        <CatBubble />
      </section>

      <Section id="features" title="Everything a darts night needs" intro="And nothing that gets in the way.">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex flex-col gap-3 rounded-3xl bg-card p-6">
              <div className="flex h-12 items-center">{f.badge}</div>
              <h3 className="font-extrabold text-xl">{f.title}</h3>
              <p className="text-foreground/70">{f.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="screenshots" title="Have a look" intro="Made for iPad first. Just as happy on a phone.">
        <Gallery devices={screenshots} />
      </Section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:px-6 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-3xl bg-mint-soft p-8">
          <h2 className="font-extrabold text-2xl text-mint-ink">Your darts stay home</h2>
          <p>
            No account, no cloud, no analytics. Players, matches and every single dart live in a database on your
            device.
          </p>
          <Link href="/privacy" className="self-start font-extrabold text-mint-ink underline underline-offset-4">
            Read the privacy policy
          </Link>
        </div>
        <div className="flex flex-col gap-3 rounded-3xl bg-butter-soft p-8">
          <h2 className="font-extrabold text-2xl text-butter-ink">Open source, MIT</h2>
          <p>Read the code, report a bug, or teach the cat a new trick. Pull requests welcome.</p>
          <a href={REPO_URL} className="self-start font-extrabold text-butter-ink underline underline-offset-4">
            RaphaelMitas/purrphect on GitHub
          </a>
        </div>
      </section>
    </>
  );
}
