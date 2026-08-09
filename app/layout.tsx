import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const beskrivelse =
  "KI-drevet bedrift-i-en-boks for norske solo- og mikrobedrifter: profil, booking, faktura og kundedialog i én lett pakke.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL || "http://localhost:3000"),
  title: { default: "Bedriftsflyt", template: "%s · Bedriftsflyt" },
  description: beskrivelse,
  openGraph: {
    title: "Bedriftsflyt",
    description: beskrivelse,
    type: "website",
    locale: "nb_NO",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb">
      <body>
        {children}
        {/* GoatCounter - cookieless besøksstatistikk */}
        <Script
          src="https://gc.zgo.at/count.js"
          data-goatcounter="https://bedriftsflyt.goatcounter.com/count"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
