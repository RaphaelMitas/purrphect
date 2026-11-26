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
    <Prose title="Privacy" updated="26 November 2026">
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
        dart.purrphect.com sets no cookies and stores nothing in your browser. The fonts and scripts ship with the site,
        so loading a page sends no request to anyone else.
      </p>
      <p>
        The site runs on a server of Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Germany, in a data
        centre in Helsinki, Finland. Hetzner processes data on our behalf under Art. 28 GDPR. To deliver a page, the
        server processes what your browser sends with every request, in particular your IP address, the time, the
        address you asked for and your browser and operating system. It keeps no access log. Technical error logs can
        occasionally contain an IP address; they are limited in size and overwritten continuously. The legal basis is
        Art. 6(1)(f) GDPR, our legitimate interest in delivering the site securely and reliably.
      </p>
      <p>
        The App Store badge leads to Apple's App Store, where Apple's privacy policy applies. The GitHub links lead to
        GitHub, where GitHub's privacy statement applies.
      </p>

      <h2>Visitor counts</h2>
      <p>
        We count visits to this website with Plausible, running on that same server, without cookies and without any
        third party. It records the page you open, the website you came from (only its domain), campaign tags in the
        link, your browser, operating system, device type and country, and whether you clicked the App Store badge. Your
        IP address and browser details are used to work out a visitor hash from a salt that changes daily, and that hash
        is stored with each visit. The IP address itself is not stored.
      </p>
      <p>
        The data is deleted after 25 months. The legal basis is Art. 6(1)(f) GDPR, our legitimate interest in knowing
        how people find the site and whether they get the app. This is about the website only: the app itself still
        counts nothing.
      </p>
      <p>
        You can object to this at any time, without giving a reason: turn on Global Privacy Control or Do Not Track in
        your browser, and nothing is recorded from then on.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, find our full contact details in
        the <Link href="/imprint">imprint</Link>, or open an issue on <a href={REPO_URL}>GitHub</a>.
      </p>
    </Prose>
  );
}
