"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2, ArrowRightLeft, X, Undo2 } from "lucide-react";

const CATEGORIES = [
  { id: 'MOVIE', label: '🎬 Films' },
  { id: 'ANIMATION_MOVIE', label: '🎨 Animation' },
  { id: 'SERIES', label: '📺 Séries' },
  { id: 'ANIME', label: '⛩️ Animés' },
  { id: 'GAME', label: '🎮 Jeux' }, // "Jeux Vidéo" raccourci en "Jeux" pour mobile
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

const BOOK_COLORS = [
  'from-red-900 to-red-800', 'from-blue-900 to-blue-800', 'from-green-900 to-green-800', 
  'from-purple-900 to-purple-800', 'from-amber-900 to-amber-800', 'from-slate-800 to-slate-900',
];

export default function MyListView({ items }: { items: any[] }) {
  const [activeTab, setActiveTab] = useState('MOVIE');
  const [localItems, setLocalItems] = useState(items);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { setLocalItems(items); }, [items]);

  const getPileTitle = (tab: string) => {
    if (tab === 'BOOK') return "Lire (PAL)";
    if (tab === 'GAME') return "Jouer (PAJ)";
    return "Voir (PAV)";
  };

  const getBookColor = (title: string) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
    return BOOK_COLORS[Math.abs(hash % BOOK_COLORS.length)];
  };

  const getCategory = (item: any) => {
    if (item.bookId) return 'BOOK';
    if (item.gameId) return 'GAME';
    if (item.movieId && item.movie) {
        const movie = item.movie;
        const genres = movie.genreIds ? movie.genreIds.split(',') : [];
        const isAnimation = genres.includes('16');
        const isJapanese = movie.originalLanguage === 'ja';
        if (movie.type === 'tv') return (isAnimation && isJapanese) ? 'ANIME' : 'SERIES';
        return (isAnimation) ? (isJapanese ? 'ANIME' : 'ANIMATION_MOVIE') : 'MOVIE';
    }
    return 'UNKNOWN';
  };

  const getItemDetails = (item: any) => {
    if (item.book) return { title: item.book.title, poster: item.book.posterPath, subtitle: item.book.authors, rankId: item.ranking, isBook: true };
    if (item.game) return { title: item.game.title, poster: item.game.posterPath, subtitle: item.game.developers, rankId: item.ranking };
    if (item.movie) return { title: item.movie.title, poster: item.movie.posterPath ? `https://image.tmdb.org/t/p/w300${item.movie.posterPath}` : null, subtitle: item.movie.releaseYear, rankId: item.ranking };
    return { title: 'Inconnu', poster: null, subtitle: '', rankId: null };
  };

  const getRankingBadge = (rankId: string | null) => {
    const section = RANKING_SECTIONS.find(s => s.id === rankId);
    if (!section) return null;
    return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/10 ${section.badgeBg} ${section.badgeText}`}>{section.title.split(' ')[0]}</span>;
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Supprimer définitivement ?")) return;
    setLocalItems(prev => prev.filter(i => i.id !== id));
    setMenuOpenId(null);
    try {
        const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Erreur API");
        router.refresh();
    } catch (e) {
        console.error(e);
        alert("Erreur serveur lors de la suppression.");
    }
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
    <div key={item.id} className="group relative flex flex-col h-full animate-in fade-in duration-500">
      <div className={`relative aspect-[2/3] w-full rounded-xl overflow-hidden border bg-[#1a1a1a] transition-all duration-300 ${styleClass} ${details.isBook ? 'rounded-r-md shadow-lg aspect-[1/1.5]' : ''} ${details.isBook && !details.poster ? 'bg-gradient-to-br ' + getBookColor(details.title) : ''}`}>
        
        {details.isBook && <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/60 to-transparent rounded-l-sm z-10"></div>}
        
        {details.poster ? (
           <img src={details.poster} className="w-full h-full object-cover" alt={details.title} onError={(e) => {
              if(details.isBook) {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', ...getBookColor(details.title).split(' '));
                 const titleEl = document.getElementById(`fallback-${item.id}`);
                 if(titleEl) titleEl.style.display = 'flex';
              }
           }}/>
        ) : (
           details.isBook ? null : <div className="flex items-center justify-center h-full text-gray-600 text-xs text-center p-2">{details.title}</div>
        )}

        {/* Titre de secours (Livre sans image) */}
        {details.isBook && (
            <div id={`fallback-${item.id}`} className={`absolute inset-0 ml-3 p-3 flex-col justify-center items-center text-center ${details.poster ? 'hidden' : 'flex'}`}>
                <span className="text-white font-serif font-bold text-xs leading-snug line-clamp-4 drop-shadow-md">{details.title}</span>
            </div>
        )}

        {/* Overlay Infos (Sur mobile, on peut cacher ça ou le laisser) */}
        {!details.isBook && (
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none hidden md:flex">
                <span className="text-white font-bold text-sm leading-tight mb-1">{details.title}</span>
                <span className="text-yellow-500 text-xs truncate">{details.subtitle}</span>
            </div>
        )}

        {/* Bouton Menu (Plus gros sur mobile pour le doigt) */}
        <button 
            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === item.id ? null : item.id); setMovingId(null); }}
            className={`absolute top-1 right-1 p-2 rounded-full bg-black/70 text-white z-30 shadow-lg ${menuOpenId === item.id ? 'bg-white text-black' : 'md:opacity-0 md:group-hover:opacity-100'}`}
        >
            <MoreVertical size={16} />
        </button>

        {!movingId && <div className="absolute top-1 left-1 z-20 pointer-events-none">{getRankingBadge(details.rankId)}</div>}

        {/* MENU DÉROULANT */}
        {menuOpenId === item.id && !movingId && (
            <div className="absolute top-8 right-1 w-36 bg-[#111] border border-gray-600 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button onClick={(e) => { e.stopPropagation(); setMovingId(item.id); }} className="w-full text-left px-3 py-3 text-xs text-gray-100 hover:bg-[#333] flex items-center gap-2">
                    <ArrowRightLeft size={14} /> Déplacer
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="w-full text-left px-3 py-3 text-xs text-red-400 hover:bg-red-900/30 flex items-center gap-2 border-t border-gray-700">
                    <Trash2 size={14} /> Supprimer
                </button>
            </div>
        )}

        {/* MENU DÉPLACEMENT */}
        {movingId === item.id && (
             <div className="absolute inset-0 bg-[#000]/95 z-50 flex flex-col items-center justify-center p-2 text-center animate-in fade-in">
                 <button onClick={(e) => { e.stopPropagation(); handleMove(item.id, null, 'PAV'); }} className="w-full py-1.5 mb-2 rounded border border-gray-600 bg-gray-800 text-gray-200 text-[9px] font-bold flex items-center justify-center gap-1">
                    <Undo2 size={10} /> {getPileTitle(activeTab).split(' ')[0]}
                 </button>

                 <div className="grid grid-cols-2 gap-1 w-full">
                    {RANKING_SECTIONS.map(rank => (
                        <button key={rank.id} onClick={(e) => { e.stopPropagation(); handleMove(item.id, rank.id, 'VU'); }} className={`text-[9px] py-1 rounded border border-white/10 ${rank.badgeBg} ${rank.badgeText}`}>
                            {rank.title.split(' ')[0]}
                        </button>
                    ))}
                 </div>
                 <button onClick={(e) => { e.stopPropagation(); setMovingId(null); }} className="mt-2 text-gray-400 hover:text-white"><X size={16}/></button>
             </div>
        )}
      </div>

      {/* Titre Mobile */}
      {(details.isBook || activeTab === 'BOOK') && (
         <div className="mt-2 ml-1">
            <h4 className="text-white font-bold text-xs leading-tight line-clamp-2">{details.title}</h4>
            <p className="text-gray-500 text-[10px] mt-0.5 truncate">{details.subtitle}</p>
         </div>
      )}
    </div>
  );

  return (
    <div>
      {/* ONGLETS DÉFILABLES (Scroll Horizontal sur mobile) */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2 overflow-x-auto scrollbar-hide snap-x">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => { setActiveTab(cat.id); setMenuOpenId(null); }} className={`whitespace-nowrap flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all border snap-center ${activeTab === cat.id ? "bg-yellow-500 text-black border-yellow-500" : "bg-[#1a1a1a] text-gray-400 hover:text-white border-[#333]"}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* PILE HORIZONTALE (Reste inchangée car déjà scrollable) */}
      {pileItems.length > 0 && (
        <section className="mb-10 bg-[#161616]/50 p-4 rounded-xl border border-[#222]">
            <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg md:text-2xl font-bold text-white">⏳ Pile à {getPileTitle(activeTab)}</h2>
                <div className="h-[1px] bg-gray-800 flex-grow"></div>
                <span className="text-yellow-500 font-bold text-sm">{pileItems.length}</span>
            </div>
            {/* Ajout padding-bottom pour le menu sur mobile */}
            <div className="flex gap-3 overflow-x-auto pb-32 -mb-24 scrollbar-thin scrollbar-thumb-yellow-900 scrollbar-track-transparent px-1">
                {pileItems.map(item => (
                    <div key={item.id} className="min-w-[110px] w-[110px] md:min-w-[140px] md:w-[140px]">
                        {renderCard(item, getItemDetails(item), 'border-[#333]')}
                    </div>
                ))}
            </div>
        </section>
      )}

      {/* GRILLES RESPONSIVE (2 colonnes sur mobile -> 6 sur PC) */}
      {activeTab === 'BOOK' ? (
        <div className="animate-in fade-in zoom-in-95 duration-500">
           <div className="flex items-center gap-3 mb-6">
                <h3 className="text-xl md:text-3xl font-bold text-white">📚 Bibliothèque</h3>
                <div className="h-[1px] flex-grow bg-gray-800"></div>
                <span className="text-gray-400 font-mono text-xs">{rankedItems.length}</span>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
             {rankedItems.map(item => renderCard(item, getItemDetails(item), 'hover:shadow-yellow-500/20'))}
           </div>
        </div>
      ) : (
        <div className="space-y-12">
          {RANKING_SECTIONS.map((section) => {
            const sectionItems = rankedItems.filter(item => item.ranking === section.id);
            if (sectionItems.length === 0) return null;
            return (
              <section key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className={`text-xl md:text-2xl font-bold ${section.style.split(' ')[0]}`}>{section.title}</h3>
                  <div className="h-[1px] flex-grow bg-gray-800"></div>
                  <span className="text-gray-500 font-mono text-xs">{sectionItems.length}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
                  {sectionItems.map(item => renderCard(item, getItemDetails(item), `hover:shadow-2xl ${section.style.split(' ')[1]}`))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
