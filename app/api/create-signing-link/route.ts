import { NextRequest } from "next/server";
import { createMandateLinkToken, getAuthenticatedAdminId } from "../../lib/mandate-link";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return Response.json({ error: "Données invalides." }, { status: 400 });

    const { fees, password } = body as { fees?: unknown; password?: unknown };
    if (typeof fees !== "string" || !fees.trim() || typeof password !== "string") {
      return Response.json({ error: "Données invalides." }, { status: 400 });
    }

    const adminId = getAuthenticatedAdminId(password);
    if (!adminId) return Response.json({ error: "Authentification administrateur invalide." }, { status: 401 });

    return Response.json({ token: createMandateLinkToken(adminId, fees.trim()) });
  } catch {
    return Response.json({ error: "Impossible de créer le lien de signature." }, { status: 500 });
  }
}
