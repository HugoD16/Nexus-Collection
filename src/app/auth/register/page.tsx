"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulation simple pour l'exemple (remplace par ton appel API réel)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) router.push("/auth/login");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] text-white p-6 font-sans">
      
      {/* Conteneur principal sans bordure visible pour le style "ouvert" du portfolio */}
      <div className="w-full max-w-md">
        
        {/* En-tête style Portfolio */}
        <div className="mb-10">
          <h2 className="text-yellow-500 font-bold tracking-[0.2em] text-xs uppercase mb-2">
            Nouveau Membre
          </h2>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Créer un <br /> compte.
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Groupe : Nom */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Nom d'affichage</label>
            <input
              type="text"
              required
              placeholder="Hugo Dehay"
              className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all duration-300"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Groupe : Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Adresse Email</label>
            <input
              type="email"
              required
              placeholder="exemple@email.com"
              className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all duration-300"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Groupe : Mot de passe */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Mot de passe</label>
            <input
              type="password"
              required
              placeholder="••••••••••"
              className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all duration-300"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col gap-4">
            {/* Bouton Principal (Style "Télécharger mon CV") */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full py-3.5 px-6 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Chargement..." : "S'inscrire maintenant"}
            </button>

            {/* Bouton Secondaire (Style "LinkedIn") */}
            <Link 
              href="/auth/login"
              className="w-full flex justify-center items-center bg-transparent border border-[#333] hover:border-white text-gray-300 hover:text-white font-medium rounded-full py-3.5 px-6 transition-colors"
            >
              J'ai déjà un compte
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
