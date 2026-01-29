"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2, ArrowRightLeft, X, Undo2 } from "lucide-react";

const CATEGORIES = [
  { id: 'MOVIE', label: '🎬 Films' },
  { id: 'ANIMATION_MOVIE', label: '🎨 Animation' },
  { id: 'SERIES', label: '📺 Séries' },
  { id: 'ANIME', label: '⛩️ Animés' },
  { id: 'GAME', label: '🎮 Jeux' },
  { id: 'BOOK', label: '📚 Livres' },
];

const RANKING_SECTIONS = [
  { id: 'DIAMOND', title: '💎 Diamant', style: 'text-cyan-400 border-cyan-500/30', badgeBg: 'bg-cyan-900', badgeText: 'text-cyan-200' },
  { id: 'GOLD', title: '🥇 Or', style: 'text-yellow-400 border-yellow-500/30', badgeBg: 'bg-yellow-900', badgeText: 'text-yellow-200' },
  { id: 'SILVER', title: '🥈 Argent', style: 'text-gray-300 border-gray-500/30', badgeBg: 'bg-gray-800', badgeText: 'text-gray-300' },
  { id: 'BRONZE', title: '🥉 Bronze', style: 'text-orange-400 border-orange-500/30', badgeBg: 'bg-orange-900', badgeText: 'text-orange-200' },
  { id: 'COMMON', title: '✅ Vu / Lu / Joué', style: 'text-blue-400 border-blue-500/30', badgeBg: 'bg-blue-900', badgeText: 'text-blue-200' },
  { id: 'DISLIKED', title: '❌ Pas aimé', style: 'text-red-400 border-red-500/30', badgeBg: 'bg-red-900', badgeText: 'text-red-200' },
];

export default function MyListView({ items }: { items: any[] }) {
  const [activeTab, setActiveTab] = useState('MOVIE');
  const [localItems, setLocalItems] = useState(items);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { setLocalItems(items); }, [items]);

  const getCategory = (item: any) => {
    if (item.bookId) return 'BOOK';
    if (item.gameId) return 'GAME';
    if (item.movie) {
      // FIX: On transforme la chaîne "16,28" en tableau pour vérifier la présence du genre Animation
      const genres = item.movie.genreIds?.split(',') || [];
      const isAnimation = genres.includes('16');
      
      if (item.movie.type === 'tv') {
        return isAnimation ? 'ANIME' : 'SERIES';
      }
      // Un film avec le genre 16 va dans "Animation"
      return isAnimation ? 'ANIMATION_MOVIE' : 'MOVIE';
    }
    return 'UNKNOWN';
  };

  const getItemDetails = (item: any) => {
    if (item.book) return { title: item.book.title, poster: item.book.posterPath, subtitle: item.book.authors, rankId: item.ranking, isBook: true };
    if (item.game) return { title: item.game.title, poster: item.game.posterPath, subtitle: item.game.developers, rankId: item.ranking };
    if (item.movie) return { title: item.movie.title, poster: item.movie.posterPath ? `https://image.tmdb.org/t/p/w300${item.movie.posterPath}` : null, subtitle: item.movie.releaseYear, rankId: item.ranking };
    return { title: 'Inconnu', poster: null, subtitle: '', rankId: null };
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Supprimer ?")) return;
    setLocalItems(prev => prev.filter(i => i.id !== id));
    await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  const handleMove = async (id: string, newRank: string | null, newStatus: string) => {
    setLocalItems(prev => prev.map(item => item.id === id ? { ...item, ranking: newRank, status: newStatus } : item));
    setMovingId(null);
    setMenuOpenId(null);
    await fetch(`/api/watchlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ranking: newRank, status: newStatus })
    });
    router.refresh();
  };

  const currentTabItems = localItems.filter(item => getCategory(item) === activeTab);
  const pileItems = currentTabItems.filter(item => item.status === 'PAV');
  const rankedItems = currentTabItems.filter(item => item.status === 'VU');

  const renderCard = (item: any, details: any, styleClass: string) => (
    <div key={item.id} className="group relative flex flex-col h-full">
      <div className={`relative aspect-[2/3] w-full rounded-xl overflow-hidden border bg-[#1a1a1a] transition-all duration-300 ${styleClass}`}>
        {details.poster ? <img src={details.poster} className="w-full h-full object-cover" alt="" /> : <div className="flex items-center justify-center h-full text-gray-600 text-[10px] text-center">{details.title}</div>}
        <button onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)} className="absolute top-1 right-1 p-2 rounded-full bg-black/70 text-white"><MoreVertical size={16} /></button>
        {menuOpenId === item.id && (
          <div className="absolute top-8 right-1 w-32 bg-[#111] border border-gray-700 rounded-lg z-50 overflow-hidden">
            <button onClick={() => setMovingId(item.id)} className="w-full text-left px-3 py-2 text-[10px] hover:bg-[#222]">Déplacer</button>
            <button onClick={() => handleDelete(item.id)} className="w-full text-left px-3 py-2 text-[10px] text-red-500 hover:bg-red-900/20 border-t border-gray-800">Supprimer</button>
          </div>
        )}
        {movingId === item.id && (
          <div className="absolute inset-0 bg-black/95 z-50 flex flex-col p-2 gap-1 justify-center">
            {RANKING_SECTIONS.map(r => <button key={r.id} onClick={() => handleMove(item.id, r.id, 'VU')} className={`py-1 rounded text-[9px] font-bold ${r.badgeBg} ${r.badgeText}`}>{r.title.split(' ')[1]}</button>)}
            <button onClick={() => setMovingId(null)} className="text-[10px] text-gray-500 mt-1">Annuler</button>
          </div>
        )}
      </div>
      <h4 className="mt-2 text-white font-bold text-xs truncate">{details.title}</h4>
    </div>
  );

  return (
    <div>
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold border ${activeTab === cat.id ? "bg-yellow-500 text-black border-yellow-500 shadow-lg" : "bg-[#1a1a1a] text-gray-400 border-white/5"}`}>{cat.label}</button>
        ))}
      </div>

      {pileItems.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">⏳ Pile à {activeTab === 'BOOK' ? 'Lire' : activeTab === 'GAME' ? 'Jouer' : 'Voir'} <span className="text-yellow-500 text-sm ml-auto">{pileItems.length}</span></h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {pileItems.map(item => <div key={item.id} className="min-w-[120px] w-[120px]">{renderCard(item, getItemDetails(item), 'border-gray-800')}</div>)}
          </div>
        </section>
      )}

      <div className="space-y-12">
        {RANKING_SECTIONS.map(section => {
          const sectionItems = rankedItems.filter(i => i.ranking === section.id);
          if (sectionItems.length === 0) return null;
          return (
            <section key={section.id}>
              <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${section.style.split(' ')[0]}`}>{section.title} <div className="h-[1px] bg-white/5 flex-grow"></div> <span className="text-gray-600 text-xs">{sectionItems.length}</span></h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {sectionItems.map(item => renderCard(item, getItemDetails(item), `hover:shadow-2xl ${section.style.split(' ')[1]}`))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
