"use client";

export default function PrintKnapp() {
  return (
    <button className="btn" type="button" onClick={() => window.print()} style={{ width: "auto", padding: "10px 18px" }}>
      Skriv ut / lagre som PDF
    </button>
  );
}
