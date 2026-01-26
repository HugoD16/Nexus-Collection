"use client";

import { useState, useRef } from "react";
import { Search, Loader2, Plus, Film, BookOpen, Gamepad2, Camera, Sparkles, ImageOff } from "lucide-react";

interface MovieSearchProps {
  onAdd: (item: any) => void;
}

export default function MovieSearch({ onAdd }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [searchType, setSearchType] = useState<'movie' | 'book' | 'game'>('movie');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NOUVEAU : FONCTION POUR RÉCUPÉRER LA COUVERTURE VIA GOOGLE BOOKS ---
  const fetchBookCover = async (title: string, author?: string) => {
    try {
      const q = encodeURIComponent(`intitle:${title}${author ? `+inauthor:${author}` : ""}`);
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`);
      const data = await res.json();
      if (data.items && data.items[0]?.volumeInfo?.imageLinks?.thumbnail) {
        return data.items[0].volumeInfo.imageLinks.thumbnail.replace("http://", "https://");
      }
    } catch (e) {
      console.error("Erreur cover search", e);
    }
    return null;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${searchType}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setResults([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/scan-books", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.results) {
        // --- ENRICHISSEMENT DES RÉSULTATS AVEC LES IMAGES ---
        const enrichedResults = await Promise.all(data.results.map(async (book: any) => {
          const cover = await fetchBookCover(book.title, book.subtitle);
          return { ...book, poster: cover };
        }));
        setResults(enrichedResults);
      }
    } catch (error: any) {
      alert("Erreur : " + error.message);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#0a0a0a] p-4 md:p-6 rounded-2xl border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden">
      {isScanning && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-center p-6 backdrop-blur-md">
          <Loader2 size={56} className="text-yellow-500 animate-spin mb-4" />
          <h3 className="text-2xl font-bold text-yellow-500">Analyse IA & Recherche Images...</h3>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

      {/* TABS NOIR & OR */}
      <div className="flex gap-3 mb-8 justify-center">
        {[
          { id: 'movie', icon: Film, label: 'Films' },
          { id: 'book', icon: BookOpen, label: 'Livres' },
          { id: 'game', icon: Gamepad2, label: 'Jeux' }
        ].map((type) => (
          <button 
            key={type.id}
            onClick={() => setSearchType(type.id as any)} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
              searchType === type.id 
                ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' 
                : 'bg-[#151515] text-gray-400 border-[#2a2a2a] hover:text-yellow-500'
            }`}
          >
            <type.icon size={16}/> {type.label}
          </button>
        ))}
      </div>

      {/* RECHERCHE */}
      <div className="relative mb-8 flex gap-3">
        <form onSubmit={handleSearch} className="relative flex-grow group">
            <input
              type="text"
              placeholder="Titre, auteur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#111] border border-[#333] text-gray-200 px-5 py-4 rounded-xl focus:border-yellow-500 transition-all pl-12"
            />
            <Search className="absolute left-4 top-4 text-gray-600 group-focus-within:text-yellow-500" size={20} />
            <button type="submit" className="absolute right-3 top-3 bg-[#222] hover:bg-yellow-500 hover:text-black p-2 rounded-lg transition-all">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Search size={18}/>}
            </button>
        </form>

        {searchType === 'book' && (
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-br from-yellow-600 to-yellow-800 text-black px-5 rounded-xl border border-yellow-400 flex items-center justify-center group"
            >
                <Camera size={24} strokeWidth={2.5} />
                <Sparkles size={16} className="absolute top-2 right-2 text-white/50" />
            </button>
        )}
      </div>

      {/* RÉSULTATS STYLE NEXUS */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {results.map((item, index) => (
          <div 
            key={item.id || index} 
            className="group flex gap-4 p-3 rounded-xl bg-[#121212] hover:bg-[#1a1a1a] border border-[#222] hover:border-yellow-500/50 cursor-pointer transition-all duration-300"
            onClick={() => onAdd(item)}
          >
            <div className="w-14 h-20 bg-[#000] rounded-lg overflow-hidden flex-shrink-0 border border-[#333] relative">
               {item.poster ? (
                 <img src={item.poster} alt="" className="w-full h-full object-cover" />
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]">
                    <ImageOff size={16} className="text-gray-700 mb-1" />
                    <span className="text-[8px] text-gray-700 font-bold">N/A</span>
                 </div>
               )}
            </div>
            
            <div className="flex-grow flex flex-col justify-center min-w-0">
              <h4 className="font-bold text-gray-200 text-base truncate group-hover:text-yellow-500">
                {item.title}
              </h4>
              <span className="text-xs text-yellow-500/70">{item.subtitle || "Auteur inconnu"}</span>
            </div>

            <button className="self-center p-2.5 bg-[#1a1a1a] rounded-full text-gray-500 border border-[#333] group-hover:bg-yellow-500 group-hover:text-black group-hover:border-yellow-500 transition-all">
                <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
