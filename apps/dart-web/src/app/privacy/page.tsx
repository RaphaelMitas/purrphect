import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/prose";
import { REPO_URL, SUPPORT_EMAIL } from "@/links";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Dart Purrphect keeps all your data on your device. No accounts, no analytics.",
};

export default function Privacy() {
  return (
    <Prose title="Privacy" updated="7 November 2026">
      <p>
        Short version: Dart Purrphect keeps everything on your device. There are no accounts, no analytics, no ads and
        no servers we send your data to.
      </p>

      <h2>What the app stores</h2>
      <ul>
        <li>Player names and colours</li>
        <li>Matches, every dart thrown and the rules you played</li>
        <li>Saved setups and favourites</li>
      </ul>
      <p>
        All of it lives in a SQLite database inside the app on your device. Your stats and levels are calculated from
        that data on the device too.
      </p>

      <h2>What leaves your device</h2>
      <p>
        Nothing, from our side. The app has no backend, no tracking and no third party SDKs that phone home. We never
        see your players or your scores.
      </p>
      <p>
        Two things are up to you and your device settings. If you allow it, Apple or Google may share anonymous crash
        reports with us. If you use iCloud or Google backups, your device may include the app's data in those backups.
        Both are handled by Apple or Google under their own privacy policies.
      </p>

      <h2>Deleting your data</h2>
      <p>
        Remove the app and its data goes with it, unless a device backup restores it. We hold no copy, so there is
        nothing for us to delete on our end.
      </p>

      <h2>This website</h2>
      <p>
        dart.purrphect.com is a static site without cookies or analytics. Fonts are served from this site, not from
        Google. Our host, Vercel, processes technical data such as your IP address to deliver the pages, and keeps short
        lived server logs.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, find our full contact details in
        the <Link href="/imprint">imprint</Link>, or open an issue on <a href={REPO_URL}>GitHub</a>.
      </p>
    </Prose>
  );
}
