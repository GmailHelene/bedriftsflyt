import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bedriftsflyt",
  description:
    "KI-drevet bedrift-i-en-boks for norske solo- og mikrobedrifter: profil, booking, faktura og kundedialog i én lett pakke.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  );
}
