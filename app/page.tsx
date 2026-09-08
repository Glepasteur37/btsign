"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

type AdminData = { fees: string };
type ClientData = { lastName: string; firstName: string; address: string; operation: string };

const OPERATIONS = ["Acquisition Ancien", "Acquisition Neuf", "Terrain", "Construction", "Travaux", "Soulte", "Rachat"];

/** Encodes simple JSON safely for use as a query-string value. */
function encodeData(data: AdminData) {
  return window.btoa(encodeURIComponent(JSON.stringify(data)));
}

function decodeData(value: string): AdminData | null {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(window.atob(value)));
    if (typeof parsed === "object" && parsed !== null && typeof (parsed as AdminData).fees === "string") return parsed as AdminData;
  } catch { /* The link is invalid: show the administrator form. */ }
  return null;
}

export default function Home() {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [fees, setFees] = useState("");
  const [client, setClient] = useState<ClientData>({ lastName: "", firstName: "", address: "", operation: OPERATIONS[0] });
  const [oneTimeLink, setOneTimeLink] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("data");
    if (value) setAdmin(decodeData(value));
  }, []);

  function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = { fees: fees.trim() };
    const url = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(encodeData(data))}`;
    setOneTimeLink(url);
  }

  async function generatePdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const signaturePad = signatureRef.current;
    if (!admin || !signaturePad || signaturePad.isEmpty()) {
      setError("Veuillez renseigner tous les champs et signer le mandat.");
      return;
    }
    setError("");
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin, client, signature: signaturePad.toDataURL("image/png") }),
      });
      if (!response.ok) throw new Error("La génération du PDF a échoué.");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = "mandat-recherche-intermediation.pdf"; anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Une erreur est survenue.");
    } finally { setIsGenerating(false); }
  }

  if (!admin) return <main><section className="card"><h1>Créer un mandat</h1><p>Renseignez les honoraires afin de créer un lien de signature à usage unique.</p><form onSubmit={createLink}><label htmlFor="fees">Honoraires — Article 4</label><input id="fees" required value={fees} onChange={(e) => setFees(e.target.value)} placeholder="Ex. 1 500 € TTC" /><button type="submit">Générer le lien</button></form>{oneTimeLink && <><h2>Lien de signature</h2><a className="link" href={oneTimeLink}>{oneTimeLink}</a></>}</section></main>;

  return <main><section className="card"><h1>Mandat de recherche d&apos;intermédiation</h1><p>Veuillez compléter le mandat puis le signer.</p><form onSubmit={generatePdf}><h2>Identité</h2><label htmlFor="lastName">Nom</label><input id="lastName" required value={client.lastName} onChange={(e) => setClient({ ...client, lastName: e.target.value })} /><label htmlFor="firstName">Prénom</label><input id="firstName" required value={client.firstName} onChange={(e) => setClient({ ...client, firstName: e.target.value })} /><label htmlFor="address">Adresse</label><input id="address" required value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} /><h2>Article 1 — Projet</h2><label htmlFor="operation">Type d&apos;opération</label><select id="operation" value={client.operation} onChange={(e) => setClient({ ...client, operation: e.target.value })}>{OPERATIONS.map((operation) => <option key={operation}>{operation}</option>)}</select><h2>Signature</h2><p><strong>Lu et approuvé, bon pour mandat</strong></p><SignatureCanvas ref={signatureRef} canvasProps={{ className: "signature", width: 690, height: 180, "aria-label": "Zone de signature" }} /><button type="button" className="secondary" onClick={() => signatureRef.current?.clear()}>Effacer la signature</button>{error && <p className="error">{error}</p>}<button type="submit" disabled={isGenerating}>{isGenerating ? "Génération en cours..." : "Télécharger le mandat signé"}</button></form></section></main>;
}
