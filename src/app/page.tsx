"use client";

import { useState, useEffect } from "react";
import MovieSearch from "@/components/MovieSearch";
import { X, Check, Film, Tv, BookOpen, Gamepad2, Clapperboard, Trash2, HelpCircle, Palette } from "lucide-react";
import confetti from "canvas-confetti";
import { useSession } from "next-auth/react";
import { addToWatchlistAction } from "./actions/watchlist";

export default function Home() {
  const { data: session } = useSession();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState('MOVIE');
  const [isAnime, setIsAnime] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      const info = detectType(selectedItem);
      setCurrentType(info.type);
      setIsAnime(info.isAnime);
    }
  }, [selectedItem]);

const detectType = (item: any) => {
    // 1. Détection des Jeux et Livres (Inchangé)
    if (item.slug || item.background_image || item.gameId || (item.released && !item.release_date)) return { type: 'GAME', isAnime: false };
    if (item.authors || item.publisher || item.isbn || (item.id && typeof item.id === 'string' && item.id.startsWith('gen_'))) return { type: 'BOOK', isAnime: false };

    // 2. Détection du genre Animation (TMDB genre 16)
    const genreIds = item.genre_ids || item.genres?.map((g:any) => g.id) || [];
    const hasAnimationGenre = genreIds.includes(16);

    // 3. Détection Série (TV) vs Film (MOVIE)
    // Une série TMDB a un 'name' ou 'first_air_date'. Un film a un 'title' et 'release_date'.
    // Si 'name' existe, c'est presque toujours une série (TV).
    const isTv = item.media_type === 'tv' || !!item.first_air_date || (!!item.name && !item.release_date);

    return {
      type: isTv ? 'TV' : 'MOVIE',
      isAnime: hasAnimationGenre
    };
};

  const getPileLabel = () => {
    if (currentType === 'BOOK') return 'PAL';
    if (currentType === 'GAME') return 'PAJ';
    return 'PAV';
  };

  const addToWatchlist = async (action: string, rank?: string) => {
    if (!session?.user) return alert("Veuillez vous connecter.");

    try {
      const status = action === 'PILE' ? getPileLabel() : 'VU';
      const rankMapping: any = { 'Diamant': 'DIAMOND', 'Or': 'GOLD', 'Argent': 'SILVER', 'Bronze': 'BRONZE' };

      let ranking = rank ? rankMapping[rank] : (action === 'Pas aimé' ? 'DISLIKED' : null);
      if (action === 'DONE' && !ranking) ranking = 'COMMON';

      // On force le type en fonction du bouton sélectionné
      const dbType = currentType === 'TV' ? 'tv' : (currentType === 'GAME' ? 'game' : (currentType === 'BOOK' ? 'book' : 'movie'));
      
      const itemToSave = { 
        ...selectedItem, 
        isAnime: isAnime // Transmet si c'est de l'animation
      };

      await addToWatchlistAction(itemToSave, dbType, status, ranking);

      if (rank === 'Diamant') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#EAB308'] });
      setIsModalOpen(false);
      alert(`Ajouté !`);
    } catch (error) { 
      console.error(error); 
      alert("Erreur lors de l'enregistrement.");
    }
  };

  const getImage = () => selectedItem?.poster || selectedItem?.background_image || (selectedItem?.poster_path ? `https://image.tmdb.org/t/p/w500${selectedItem.poster_path}` : '/placeholder.png');

  const TypeButton = ({ type, anime, icon: Icon, label }: any) => (
    <button
      onClick={() => { setCurrentType(type); setIsAnime(anime); }}
      className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${
        (currentType === type && isAnime === anime)
        ? 'bg-yellow-500 text-black border-yellow-500 font-bold shadow-lg scale-105'
        : 'bg-[#151515] border-white/10 text-gray-400 hover:bg-[#222] hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <nav className="border-b border-yellow-500/10 bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter text-yellow-500">NEXUS</h1>
          <div className="flex gap-6 text-sm font-bold text-gray-400">
            <span className="text-yellow-500/50">{session?.user?.name || "Invité"}</span>
            <a href="/mylist" className="hover:text-yellow-500 transition-colors">Ma Liste</a>
          </div>
        </div>
      </nav>

      {/* FIX: Ajout de suppressHydrationWarning pour ignorer les extensions type NorthPass */}
      <div className="max-w-4xl mx-auto pt-24 px-6 text-center" suppressHydrationWarning>
        <h2 className="text-5xl font-black mb-4 uppercase tracking-tight">Rechercher</h2>
        <MovieSearch onAdd={(item) => { setSelectedItem(item); setIsModalOpen(true); }} />
      </div>

      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
          <div className="bg-[#0d0d0d] w-full max-w-xl rounded-[2.5rem] border border-yellow-500/20 overflow-hidden relative shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white z-10"><X size={24} /></button>
            <div className="p-8">
              <div className="flex gap-6 mb-8">
                <div className="w-32 h-48 bg-black rounded-xl overflow-hidden border border-white/10 flex-shrink-0 shadow-2xl">
                  <img src={getImage()} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-grow flex flex-col justify-center">
                  <h3 className="text-3xl font-black mb-2 leading-tight">{selectedItem.title || selectedItem.name}</h3>
                  <p className="text-yellow-500/50 text-xs font-black uppercase tracking-widest">
                    {currentType === 'BOOK' ? 'LIVRE' : currentType === 'GAME' ? 'JEU VIDÉO' : isAnime ? (currentType === 'TV' ? 'ANIMÉ' : 'ANIMATION') : 'FILM / SÉRIE'}
                  </p>
                </div>
              </div>
              <div className="mb-8">
                <p className="text-xs text-gray-500 font-bold uppercase mb-3 flex items-center gap-2"><HelpCircle size={12}/> Correction Manuelle du Type</p>
                <div className="flex gap-2">
                  <TypeButton type="MOVIE" anime={false} icon={Film} label="Film" />
                  <TypeButton type="MOVIE" anime={true} icon={Palette} label="Animation" />
                  <TypeButton type="TV" anime={false} icon={Tv} label="Série" />
                  <TypeButton type="TV" anime={true} icon={Clapperboard} label="Animé" />
                  <TypeButton type="BOOK" anime={false} icon={BookOpen} label="Livre" />
                  <TypeButton type="GAME" anime={false} icon={Gamepad2} label="Jeu" />
                </div>
              </div>
              <div className="space-y-3">
                <button onClick={() => addToWatchlist("PILE")} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all text-lg">
                  Ajouter à ma {getPileLabel()}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => addToWatchlist("DONE")} className="bg-[#151515] border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:border-yellow-500/50 transition-all">
                    <Check size={18} className="text-yellow-500" /> {currentType === 'BOOK' ? 'Déjà Lu' : currentType === 'GAME' ? 'Déjà Joué' : 'Déjà Vu'}
                  </button>
                  <button onClick={() => addToWatchlist("Pas aimé")} className="bg-[#151515] border border-red-500/10 text-red-500/40 font-bold py-4 rounded-xl hover:bg-red-500/10 transition-all">Pas aimé</button>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="grid grid-cols-4 gap-3">
                    {['Diamant', 'Or', 'Argent', 'Bronze'].map((rank) => (
                      <button key={rank} onClick={() => addToWatchlist("Classé", rank)} className="py-3 rounded-xl bg-[#0a0a0a] border border-white/5 hover:border-yellow-500/50 hover:bg-white/5 text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all">
                        <span className="text-lg">{rank === 'Diamant' ? '💎' : rank === 'Or' ? '🥇' : rank === 'Argent' ? '🥈' : '🥉'}</span> {rank}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
