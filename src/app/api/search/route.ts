import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type');

  if (!query) return NextResponse.json({ results: [] });

  // Récupération des clés API
  const apiKeyTMDB = process.env.TMDB_API_KEY;
  const apiKeyRAWG = process.env.RAWG_API_KEY;

  try {
    let results = [];

    // --- RECHERCHE LIVRES (Google Books + OpenLibrary) ---
    if (type === 'book') {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=fr&maxResults=10`);
      const data = await res.json();
      
      if (data.items) {
        results = data.items.map((item: any) => {
          const vol = item.volumeInfo;
          
          // Image Google par défaut
          let poster = vol.imageLinks?.thumbnail?.replace('http:', 'https:').replace('&edge=curl', '') || null;

          // Si pas d'image, tentative via ISBN (OpenLibrary)
          if (!poster && vol.industryIdentifiers) {
             const isbnInfo = vol.industryIdentifiers.find((i: any) => i.type === 'ISBN_13') || vol.industryIdentifiers.find((i: any) => i.type === 'ISBN_10');
             if (isbnInfo) {
                poster = `https://covers.openlibrary.org/b/isbn/${isbnInfo.identifier}-L.jpg`;
             }
          }

          return {
            id: item.id,
            title: vol.title,
            poster: poster,
            subtitle: vol.authors ? vol.authors[0] : 'Auteur inconnu',
            details: item
          };
        });
      }
    }

    // --- RECHERCHE FILMS (TMDB) ---
    else if (type === 'movie') {
      const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKeyTMDB}&language=fr-FR&query=${encodeURIComponent(query)}`);
      const data = await res.json();
      results = data.results
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          subtitle: item.release_date ? item.release_date.split('-')[0] : (item.first_air_date ? item.first_air_date.split('-')[0] : 'Inconnu'),
          details: item
        }));
    }

    // --- RECHERCHE JEUX (RAWG) ---
    else if (type === 'game') {
      const res = await fetch(`https://api.rawg.io/api/games?key=${apiKeyRAWG}&search=${encodeURIComponent(query)}&page_size=10`);
      const data = await res.json();
      
      results = data.results.map((item: any) => ({
        id: item.id,
        // CORRECTION ICI : RAWG utilise 'name', pas 'title' !
        title: item.name, 
        poster: item.background_image,
        subtitle: item.released ? item.released.split('-')[0] : 'Inconnu',
        details: item
      }));
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error("Erreur Search:", error);
    return NextResponse.json({ results: [] });
  }
}
