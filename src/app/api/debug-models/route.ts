import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Pas de clé API trouvée dans .env.local" }, { status: 500 });
  }

  try {
    // On demande la liste brute directement à l'API Google (sans passer par la librairie)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Erreur connexion Google", details: error }, { status: 500 });
  }
}
