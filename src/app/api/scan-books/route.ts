import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucune image reçue" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // On utilise le modèle flash rapide
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Agis comme un expert bibliothécaire. Analyse cette image d'étagère.
      Liste tous les livres visibles.
      
      IMPORTANT:
      1. Pour le titre : Sois très précis.
      2. Pour l'auteur : Trouve le nom complet si visible.
      3. Renvoie UNIQUEMENT un JSON brut (pas de markdown).
      
      Format attendu :
      {
        "results": [
          { 
            "id": "gen_ID_UNIQUE", 
            "title": "Titre du livre", 
            "subtitle": "Auteur", 
            "isbn": "Si visible, sinon null",
            "poster": null, 
            "release_date": "Année approximative ou inconnue"
          }
        ]
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: file.type || "image/jpeg" } },
    ]);

    const response = await result.response;
    let text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Nettoyage de sécurité
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }

    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("Erreur API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
