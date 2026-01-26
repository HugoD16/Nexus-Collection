"use client";

import { useState, useEffect, useMemo } from "react";
import { Trash2, ArrowLeft, Film, Tv, Gamepad2, BookOpen, Layers, Clapperboard, MonitorPlay, Pencil, X, Check } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function MyList() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("Tous");
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("nexus-watchlist");
    if (saved) {
      try { setWatchlist(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveList = (newList: any[]) => {
    setWatchlist(newList);
    localStorage.setItem("nexus-watchlist", JSON.stringify(newList));
  };

  const removeItem = (id: any) => {
    if(confirm("Supprimer ?")) saveList(watchlist.filter(i => i.id !== id));
  };

  const updateStatus = (item: any, newStatus: string, newRank?: string) => {
    const updatedList = watchlist.map(i => {
      if (i.id === item.id) return { ...i, status: newStatus, rank: newRank || (newStatus === 'DISLIKED' ? 'DISLIKED' : null) };
      return i;
    });
    saveList(updatedList);
    setEditingItem(null);
    if (newRank === 'Diamant') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#EAB308'] });
  };

  const filteredList = useMemo(() => {
    return watchlist.filter(item => {
      // Normalisation pour éviter les bugs
      const isAnimeItem = item.isAnime === true || (item.genre_ids?.includes(16) && (item.original_language === 'ja' || item.origin_country?.includes('JP')));

      switch (activeTab) {
        case 'Films': return item.type === 'MOVIE' && !isAnimeItem;
        case 'Animation': return item.type === 'MOVIE' && !isAnimeItem && item.genre_ids?.includes(16);
        case 'Séries': return item.type === 'TV' && !isAnimeItem;
        case 'Animés': return isAnimeItem;
        case 'Livres': return item.type === 'BOOK';
        case 'Jeux': return item.type === 'GAME';
        default: return true;
      }
    });
  }, [watchlist, activeTab]);

  // --- CORRECTION ICI : On utilise "Diamant" et pas "DIAMANT" ---
  const sections = [
    { title: "À faire (PAL / PAJ / PAV)", icon: "⏳", filter: (i:any) => ['PAL', 'PAJ', 'PAV'].includes(i.status) },
    { title: "Liste de Diamant", icon: "💎", filter: (i:any) => i.rank === 'Diamant' },
    { title: "Liste d'Or", icon: "🥇", filter: (i:any) => i.rank === 'Or' },
    { title: "Liste d'Argent", icon: "🥈", filter: (i:any) => i.rank === 'Argent' },
    { title: "Liste de Bronze", icon: "🥉", filter: (i:any) => i.rank === 'Bronze' },
    { title: "Terminé (Lu / Vu / Joué)", icon: "✅", filter: (i:any) => i.status === 'DONE' && !i.rank },
    { title: "Pas aimé", icon: "❌", filter: (i:any) => i.status === 'DISLIKED' || i.rank === 'DISLIKED' },
  ];

  const getBadgeColor = (status: string, rank: string) => {
    if (rank === 'Diamant') return 'bg-cyan-500 text-black border-cyan-400';
    if (rank === 'Or') return 'bg-yellow-500 text-black border-yellow-400';
    if (rank === 'Argent') return 'bg-gray-300 text-black border-white';
    if (rank === 'Bronze') return 'bg-orange-600 text-white border-orange-400';
    if (['PAL', 'PAV', 'PAJ'].includes(status)) return 'bg-blue-600 text-white border-blue-400';
    return 'bg-green-600 text-white border-green-400';
  };

  const renderSection = (section: any) => {
    const items = filteredList.filter(section.filter);
    if (items.length === 0) return null;

    return (
      <section key={section.title} className="mb-16 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
            <span className="text-3xl">{section.icon}</span> {section.title}
          </h3>
          <div className="h-[1px] bg-white/10 flex-grow"></div>
          <span className="text-yellow-500 font-black text-xl">{items.length}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/5 bg-[#0a0a0a] mb-3 relative shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-yellow-500/10">
                <img src={item.poster} className="w-full h-full object-cover" alt="" />
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button onClick={(e) => {e.stopPropagation(); removeItem(item.id)}} className="p-2 bg-black/80 rounded-lg text-red-500 hover:bg-red-600 hover:text-white"><Trash2 size={14} /></button>
                    <button onClick={(e) => {e.stopPropagation(); setEditingItem(item)}} className="p-2 bg-black/80 rounded-lg text-yellow-500 hover:bg-yellow-500 hover:text-black"><Pencil size={14} /></button>
                </div>
                <div className={`absolute bottom-2 left-2 px-2 py-1 text-[9px] font-black uppercase rounded border ${getBadgeColor(item.status, item.rank)} shadow-md`}>
                  {item.rank || item.status}
                </div>
              </div>
              <h4 className="font-bold text-sm text-gray-200 leading-tight truncate">{item.title}</h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const tabs = [
    { id: 'Tous', icon: Layers },
    { id: 'Films', icon: Film },
    { id: 'Animation', icon: Clapperboard },
    { id: 'Séries', icon: Tv },
    { id: 'Animés', icon: MonitorPlay },
    { id: 'Livres', icon: BookOpen },
    { id: 'Jeux', icon: Gamepad2 }
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-yellow-500/30">
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-yellow-500 font-black tracking-tighter hover:text-white transition-colors">
            <ArrowLeft size={20} /> Retour Recherche
          </Link>
          <div className="text-2xl font-black tracking-tighter"><span className="text-white">NEX</span><span className="text-yellow-500">US</span></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto pt-12 pb-32 px-6">
        <h2 className="text-6xl font-black mb-12 tracking-tighter text-white">Ma Collection</h2>
        <div className="flex gap-3 mb-16 overflow-x-auto pb-4 scrollbar-none">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all border ${activeTab === tab.id ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg' : 'bg-[#1a1a1a] text-gray-400 border-white/5 hover:border-white/20 hover:text-white'}`}>
              <tab.icon size={14} /> {tab.id}
            </button>
          ))}
        </div>

        {sections.map(renderSection)}
        
        {filteredList.length === 0 && <p className="text-gray-500 italic text-center py-20">Aucune œuvre trouvée dans cette catégorie.</p>}
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/80 animate-in fade-in">
          <div className="bg-[#0d0d0d] w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl relative">
             <button onClick={() => setEditingItem(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24} /></button>
             <h3 className="text-2xl font-black mb-1">Modifier</h3>
             <div className="space-y-3 mt-6">
                <button onClick={() => updateStatus(editingItem, ['PAL','PAJ','PAV'].includes(editingItem.status) ? editingItem.status : 'PAV')} className="w-full bg-blue-600 text-white font-black py-3 rounded-xl">Remettre dans la Pile</button>
                <div className="grid grid-cols-2 gap-2">
                    {['Diamant', 'Or', 'Argent', 'Bronze'].map((rank) => (
                    <button key={rank} onClick={() => updateStatus(editingItem, 'DONE', rank)} className="py-2 rounded-lg bg-[#0a0a0a] border border-white/5 text-[10px] font-black uppercase text-white hover:border-yellow-500">{rank}</button>
                    ))}
                </div>
                <button onClick={() => updateStatus(editingItem, 'DISLIKED')} className="w-full text-red-500/50 hover:text-red-500 text-xs font-bold py-2 mt-2">Pas aimé</button>
             </div>
          </div>
        </div>
      )}
    </main>
  );
}
