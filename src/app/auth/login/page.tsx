"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const res = await signIn("credentials", { email, password, redirect: false });
    
    if (res?.ok) {
      router.push("/");
    } else {
      alert("Email ou mot de passe incorrect");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] text-white p-6 font-sans">
      <div className="w-full max-w-md">
        
        {/* En-tête style Portfolio */}
        <div className="mb-10">
          <h2 className="text-yellow-500 font-bold tracking-[0.2em] text-xs uppercase mb-2">
            Mon Compte
          </h2>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Bon retour <br /> parmi nous.
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Adresse Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="exemple@email.com"
              className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all duration-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••"
              className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all duration-300"
            />
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full py-3.5 px-6 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>

            <Link 
              href="/auth/register"
              className="w-full flex justify-center items-center bg-transparent border border-[#333] hover:border-white text-gray-300 hover:text-white font-medium rounded-full py-3.5 px-6 transition-colors"
            >
              Pas encore de compte ?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
