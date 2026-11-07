import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = {
  title: "Imprint",
};

const OWNER = {
  name: "[Full name]",
  street: "[Street and number]",
  city: "[Postcode and city]",
  email: "[Email address]",
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
      <p>Email: {OWNER.email}</p>

      <h2>Responsible for content (§ 18 Abs. 2 MStV)</h2>
      <p>{OWNER.name}, address as above.</p>
    </Prose>
  );
}
