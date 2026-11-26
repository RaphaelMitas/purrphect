import type { Metadata } from "next";
import { Prose } from "@/components/prose";
import { OWNER, SUPPORT_EMAIL } from "@/links";

export const metadata: Metadata = {
  title: "Imprint",
};

export default function Imprint() {
  return (
    <Prose title="Imprint">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {OWNER.name}
        <br />
        {OWNER.careOf}
        <br />
        {OWNER.street}
        <br />
        {OWNER.city}
        <br />
        Germany
      </p>

      <h2>Contact</h2>
      <p>
        Phone: {OWNER.phone}
        <br />
        Email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>

      <h2>Responsible for content (§ 18 Abs. 2 MStV)</h2>
      <p>{OWNER.name}, address as above.</p>
    </Prose>
  );
}
