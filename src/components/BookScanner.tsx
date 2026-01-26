"use client";
import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, Plus } from "lucide-react";

export default function BookScanner({ onAddBook }: { onAddBook: (book: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedBooks, setScannedBooks] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour compresser l'image avant envoi
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1024; // On réduit à 1024px de large max
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Compression JPEG à 70% de qualité
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true); // On affiche le chargement tout de suite
    
    try {
      // 1. On compresse l'image (ça prend quelques millisecondes)
      const compressedImage = await resizeImage(file);
      
      // 2. On lance l'analyse
      startScan(compressedImage);
    } catch (error) {
      console.error("Erreur compression:", error);
      setScanning(false);
    }
  };

  const startScan = async (image: string) => {
    setScannedBooks([]);
    try {
      const res = await fetch("/api/scan-books", {
        method: "POST",
        body: JSON.stringify({ image }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Erreur serveur");

      const data = await res.json();
      setScannedBooks(data.books || []);
      
      if (data.books?.length === 0) {
        alert("Aucun livre identifié. Essayez une photo plus nette ou mieux éclairée.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de l'analyse (Vérifiez votre clé API et la taille de l'image).");
    } finally {
      setScanning(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#222] hover:bg-[#333] text-gray-200 rounded-lg border border-[#444] transition-colors text-sm font-bold"
      >
        <Camera size={16} />
        Scanner une étagère
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#161616]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📸 Scanner
                {scanning && <Loader2 className="animate-spin text-yellow-500" size={18} />}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              {!scanning && scannedBooks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-10 space-y-6">
                  <div className="p-6 bg-[#222] rounded-full">
                    <Camera size={48} className="text-gray-500" />
                  </div>
                  <p className="text-center text-gray-400 max-w-sm">
                    Prenez une photo de vos livres (titres lisibles).
                  </p>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <button onClick={() => fileInputRef.current?.click()} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105">
                    <Upload size={20} /> Choisir une photo
                  </button>
                </div>
              )}

              {scanning && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-yellow-500 mb-4" size={40} />
                    <p className="text-yellow-500 font-bold text-xl animate-pulse">L'IA analyse votre bibliothèque...</p>
                    <p className="text-gray-500 mt-2 text-sm">Cela peut prendre quelques secondes.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scannedBooks.map((book) => (
                  <div key={book.googleId} className="flex gap-3 bg-[#1a1a1a] p-3 rounded-xl border border-[#333]">
                    <img src={book.poster} className="w-12 h-16 object-cover rounded bg-gray-800" alt="Cover" />
                    <div className="flex-grow min-w-0">
                      <h4 className="text-white font-bold text-sm truncate">{book.title}</h4>
                      <p className="text-gray-500 text-xs truncate">{book.authors}</p>
                    </div>
                    <button onClick={() => onAddBook({ id: book.googleId, title: book.title, poster: book.poster, subtitle: book.authors, details: { volumeInfo: { publishedDate: book.year } } })} className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center hover:bg-white transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
