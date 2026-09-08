"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

type ClientData = { lastName: string; firstName: string; address: string; operation: string };

const OPERATIONS = ["Acquisition Ancien", "Acquisition Neuf", "Terrain", "Construction", "Travaux", "Soulte", "Rachat"];

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [fees, setFees] = useState("");
  const [password, setPassword] = useState("");
  const [client, setClient] = useState<ClientData>({ lastName: "", firstName: "", address: "", operation: OPERATIONS[0] });
  const [oneTimeLink, setOneTimeLink] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token");
    if (value) setToken(value);
  }, []);

  async function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/create-signing-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fees, password }) });
      const result: unknown = await response.json();
      if (!response.ok || !result || typeof result !== "object" || typeof (result as { token?: unknown }).token !== "string") {
        throw new Error((result as { error?: string })?.error ?? "Impossible de créer le lien de signature.");
      }
      const linkToken = (result as { token: string }).token;
      setOneTimeLink(`${window.location.origin}${window.location.pathname}?token=${encodeURIComponent(linkToken)}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Une erreur est survenue."); }
  }

  async function generatePdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const signaturePad = signatureRef.current;
    if (!token || !signaturePad || signaturePad.isEmpty()) {
      setError("Veuillez renseigner tous les champs et signer le mandat.");
      return;
    }
    setError("");
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, client, signature: signaturePad.toDataURL("image/png") }),
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

  if (!token) return <main><section className="card"><h1>Créer un mandat</h1><p>Authentifiez-vous et renseignez les honoraires afin de créer un lien de signature sécurisé.</p><form onSubmit={createLink}><label htmlFor="fees">Honoraires — Article 4</label><input id="fees" required value={fees} onChange={(e) => setFees(e.target.value)} placeholder="Ex. 1 500 € TTC" /><label htmlFor="password">Mot de passe administrateur</label><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /><button type="submit">Générer le lien</button></form>{error && <p className="error">{error}</p>}{oneTimeLink && <><h2>Lien de signature</h2><a className="link" href={oneTimeLink}>{oneTimeLink}</a></>}</section></main>;

  return <main><section className="card"><h1>Mandat de recherche d&apos;intermédiation</h1><p>Veuillez compléter le mandat puis le signer.</p><form onSubmit={generatePdf}><h2>Identité</h2><label htmlFor="lastName">Nom</label><input id="lastName" required value={client.lastName} onChange={(e) => setClient({ ...client, lastName: e.target.value })} /><label htmlFor="firstName">Prénom</label><input id="firstName" required value={client.firstName} onChange={(e) => setClient({ ...client, firstName: e.target.value })} /><label htmlFor="address">Adresse</label><input id="address" required value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} /><h2>Article 1 — Projet</h2><label htmlFor="operation">Type d&apos;opération</label><select id="operation" value={client.operation} onChange={(e) => setClient({ ...client, operation: e.target.value })}>{OPERATIONS.map((operation) => <option key={operation}>{operation}</option>)}</select><h2>Signature</h2><p><strong>Lu et approuvé, bon pour mandat</strong></p><SignatureCanvas ref={signatureRef} canvasProps={{ className: "signature", width: 690, height: 180, "aria-label": "Zone de signature" }} /><button type="button" className="secondary" onClick={() => signatureRef.current?.clear()}>Effacer la signature</button>{error && <p className="error">{error}</p>}<button type="submit" disabled={isGenerating}>{isGenerating ? "Génération en cours..." : "Télécharger le mandat signé"}</button></form></section></main>;
}
