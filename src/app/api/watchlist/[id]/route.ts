import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// --- SUPPRIMER (DELETE) ---
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  // 1. On attend que les paramètres soient chargés (Spécifique Next.js 15)
  const params = await props.params;

  console.log("🗑️ DELETE reçu pour l'ID :", params.id);

  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  try {
    // 2. On effectue la suppression
    await prisma.watchlistItem.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur suppression :", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// --- MODIFIER / DÉPLACER (PATCH) ---
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  // 1. On attend les paramètres ici aussi
  const params = await props.params;

  console.log("🔄 PATCH reçu pour l'ID :", params.id);
  
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const { ranking, status } = body;

    // Si on retourne vers une pile (PAV), on enlève le classement (rank = null)
    const updateData = {
        status: status,
        ranking: status === 'PAV' ? null : ranking
    };

    const updatedItem = await prisma.watchlistItem.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error("❌ Erreur modification :", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
