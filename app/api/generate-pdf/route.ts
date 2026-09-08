import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

type Payload = {
  admin: { fees: string };
  client: { lastName: string; firstName: string; address: string; operation: string };
  signature: string;
};

function isPayload(value: unknown): value is Payload {
  if (!value || typeof value !== "object") return false;
  const { admin, client, signature } = value as Payload;
  return typeof admin?.fees === "string" && typeof client?.lastName === "string" && typeof client?.firstName === "string" && typeof client?.address === "string" && typeof client?.operation === "string" && typeof signature === "string" && signature.startsWith("data:image/png;base64,");
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!isPayload(body)) return Response.json({ error: "Données de mandat invalides." }, { status: 400 });
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const text = (value: string, x: number, y: number, size = 12, isBold = false) => page.drawText(value, { x, y, size, font: isBold ? bold : font, color: rgb(0.08, 0.13, 0.23) });
    text("MANDAT DE RECHERCHE D'INTERMÉDIATION", 90, 780, 17, true);
    text("Identité du mandant", 50, 720, 14, true);
    text(`Nom : ${body.client.lastName}`, 50, 690);
    text(`Prénom : ${body.client.firstName}`, 50, 667);
    text(`Adresse : ${body.client.address}`, 50, 644);
    text("Article 1 — Projet", 50, 590, 14, true);
    text(`Type d'opération : ${body.client.operation}`, 50, 565);
    text("Article 4 — Honoraires", 50, 510, 14, true);
    text(`Montant des honoraires : ${body.admin.fees}`, 50, 485);
    text("Lu et approuvé, bon pour mandat", 50, 285, 12, true);
    const signatureBytes = Uint8Array.from(Buffer.from(body.signature.split(",")[1], "base64"));
    const signature = await pdf.embedPng(signatureBytes);
    const scaled = signature.scaleToFit(300, 140);
    page.drawImage(signature, { x: 50, y: 100, width: scaled.width, height: scaled.height });
    const bytes = await pdf.save();
    // Copy to a plain ArrayBuffer so it is accepted by the web Response API.
    const pdfBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new Response(pdfBuffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="mandat-recherche-intermediation.pdf"' } });
  } catch {
    return Response.json({ error: "Impossible de générer le PDF." }, { status: 500 });
  }
}
