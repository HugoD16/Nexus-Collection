import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// --- RÉCUPÉRER LA LISTE (GET) ---
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ results: [] });

    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId: user.id },
      include: { movie: true, book: true, game: true },
      orderBy: { addedAt: 'desc' }
    });

    return NextResponse.json(watchlist);
  } catch (error) {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// --- AJOUTER UN ITEM (POST) ---
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Connectez-vous" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { categoryType, status, ranking, data } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("User not found");

    let mediaIdObj = {};

    // =========================================================
    // 🎬 LOGIQUE FILMS / SÉRIES / ANIMÉS
    // =========================================================
    if (categoryType === 'movie') {
        const realId = parseInt(String(data.id || data.tmdbId));
        const realPoster = data.poster || data.posterPath;
        
        const details = data.details || {};
        const realType = details.media_type || data.type || 'movie';
        
        // --- CORRECTION DU BUG DES GENRES ICI ---
        // On récupère les genres (qui peuvent être une liste [16, 18] ou déjà du texte)
        const rawGenres = details.genre_ids || data.genreIds;
        let finalGenreIds = '';

        // Si c'est une liste (Array), on joint avec des virgules
        if (Array.isArray(rawGenres)) {
            finalGenreIds = rawGenres.join(',');
        } else {
            // Sinon on s'assure que c'est une chaine de caractères
            finalGenreIds = String(rawGenres || '');
        }
        // ----------------------------------------

        const lang = details.original_language || data.originalLanguage || 'en';
        
        // Date : on s'assure que c'est du texte
        const dateStr = details.release_date || details.first_air_date || data.releaseDate || '';
        const year = dateStr.split('-')[0] || 'N/A';

        const movie = await prisma.movie.upsert({
            where: { tmdbId: realId },
            update: {}, 
            create: {
                tmdbId: realId,
                title: data.title,
                posterPath: realPoster,
                type: realType,
                releaseYear: String(year), // On force le String
                genreIds: finalGenreIds,   // On envoie bien "16,18,10759" (String)
                originalLanguage: lang 
            }
        });
        mediaIdObj = { movieId: movie.id };
    } 
    
    // =========================================================
    // 📚 LOGIQUE LIVRES
    // =========================================================
    else if (categoryType === 'book') {
        const realId = String(data.id || data.googleId);
        const realPoster = data.poster || data.posterPath;

        const book = await prisma.book.upsert({
            where: { googleId: realId },
            update: {},
            create: {
                googleId: realId,
                title: data.title,
                posterPath: realPoster,
                authors: data.subtitle || data.authors || 'Inconnu',
                publishedDate: data.publishedDate || ''
            }
        });
        mediaIdObj = { bookId: book.id };
    }
    
    // =========================================================
    // 🎮 LOGIQUE JEUX
    // =========================================================
    else if (categoryType === 'game') {
        const realId = parseInt(String(data.id || data.rawgId));
        const realPoster = data.poster || data.posterPath;

        const game = await prisma.game.upsert({
            where: { rawgId: realId },
            update: {},
            create: {
                rawgId: realId,
                title: data.title,
                posterPath: realPoster,
                developers: data.subtitle || data.developers || '',
                releaseDate: data.releaseDate || ''
            }
        });
        mediaIdObj = { gameId: game.id };
    }

    // Création de l'entrée Watchlist
    const newItem = await prisma.watchlistItem.create({
        data: {
            userId: user.id,
            status: status,
            ranking: ranking,
            ...mediaIdObj
        }
    });

    return NextResponse.json(newItem);

  } catch (error) {
    console.error("ERREUR AJOUT:", error);
    return NextResponse.json({ message: "Erreur lors de l'ajout" }, { status: 500 });
  }
}
