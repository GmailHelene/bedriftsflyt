import Link from "next/link";
import { loggUt } from "./actions";

const CHIPS: [string, string][] = [
  ["/dashboard", "Oversikt"],
  ["/dashboard/kalender", "Kalender"],
  ["/dashboard/kunder", "Kunder"],
  ["/dashboard/samtaler", "Samtaler"],
  ["/dashboard/komponer", "KI-tekst"],
  ["/dashboard/utseende", "Utseende"],
  ["/dashboard/synlighet", "Din side"],
  ["/dashboard/oppsett", "Innstillinger"],
];

// Felles topp-navigasjon på alle innloggede dashbord-sider.
export default function DashboardNav() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          Bedriftsflyt
        </div>
        <form action={loggUt} style={{ marginLeft: "auto" }}>
          <button
            type="submit"
            className="muted"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontFamily: "inherit", padding: 0, color: "var(--muted)" }}
          >
            Logg ut
          </button>
        </form>
      </div>

      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        {CHIPS.map(([href, tekst]) => (
          <Link
            key={href}
            href={href}
            className="btn-ghost"
            style={{ display: "inline-flex", padding: "7px 13px", borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: "none" }}
          >
            {tekst}
          </Link>
        ))}
      </nav>
    </>
  );
}
