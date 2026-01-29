'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

export async function addToWatchlistAction(item: any, type: string, status: string, ranking?: string | null) {
  // 1. Récupération de la session serveur pour identifier l'utilisateur
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Non connecté");

  // 2. Récupération de l'ID utilisateur dans PostgreSQL
  const dbUser = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  });
  if (!dbUser) throw new Error("Utilisateur non trouvé en base de données");

  const mediaId = item.id.toString();

  // 3. Gestion des médias par type
  if (type === 'movie' || type === 'tv') {
    // Construction de la liste des genres (doit inclure 16 pour l'animation)
    let genreList = item.genre_ids ? item.genre_ids.join(',') : "";
    if (item.isAnime && !genreList.includes('16')) {
      genreList = genreList ? `${genreList},16` : "16";
    }

    await prisma.movie.upsert({
      where: { tmdbId: item.id },
      update: { 
        type: type, // FORCE la mise à jour (ex: transforme un 'movie' en 'tv')
        genreIds: genreList 
      },
      create: {
        id: mediaId, 
        tmdbId: item.id, 
        title: item.title || item.name,
        type: type, 
        posterPath: item.poster || item.poster_path,
        releaseYear: (item.release_date || item.first_air_date || "").split("-")[0],
        genreIds: genreList, 
        originalLanguage: item.original_language || "en"
      }
    });
  } 
  else if (type === 'book') {
    await prisma.book.upsert({
      where: { id: mediaId },
      update: {},
      create: { 
        id: mediaId, 
        googleId: item.id || mediaId, // Correction du champ obligatoire
        title: item.title, 
        authors: item.subtitle || "Auteur inconnu", 
        posterPath: item.poster 
      }
    });
  } 
  else if (type === 'game') {
    await prisma.game.upsert({
      where: { id: mediaId },
      update: {},
      create: { 
        id: mediaId, 
        rawgId: parseInt(mediaId), // Correction du champ obligatoire pour les jeux
        title: item.title, 
        developers: item.subtitle || "Inconnu", 
        posterPath: item.poster 
      }
    });
  }

  // 4. Création du lien dans la Watchlist avec les bons IDs
  await prisma.watchlistItem.create({
    data: {
      userId: dbUser.id,
      status: status,
      ranking: ranking,
      movieId: (type === 'movie' || type === 'tv') ? mediaId : null,
      bookId: type === 'book' ? mediaId : null,
      gameId: type === 'game' ? mediaId : null,
    }
  });

  // 5. Rafraîchissement des données pour tous les appareils
  revalidatePath('/mylist');
}
