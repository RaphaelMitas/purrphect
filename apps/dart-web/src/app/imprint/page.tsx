import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = {
  title: "Imprint",
};

const OWNER = {
  name: "Raphael Mitas",
  street: "Weiterstädter Str. 65",
  city: "64291 Darmstadt",
  email: "mail@raphaelmitas.com",
  phone: "+49 15679 769941",
};

export default function Imprint() {
  return (
    <Prose title="Imprint">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {OWNER.name}
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
        Email: <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>
      </p>

      <h2>Responsible for content (§ 18 Abs. 2 MStV)</h2>
      <p>{OWNER.name}, address as above.</p>
    </Prose>
  );
}
