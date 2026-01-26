"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#111111]/80 backdrop-blur-md border-b border-[#333]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">

	{/* Logo NEXUS */}
	     <Link href="/" className="font-extrabold text-2xl tracking-[0.2em] text-white hover:text-gray-300 transition-colors uppercase">
  	       NEX<span className="text-yellow-500">US</span>
	     </Link>

        {/* Menu */}
        <div className="flex items-center gap-6">
          {session ? (
            <>
              <span className="text-sm text-gray-400 hidden md:block">
                {session.user?.name}
              </span>
              
	     <Link href="/mylist" className="text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors mr-4">
  			Ma Liste
	     </Link>

	      <button 
                onClick={() => signOut()} 
                className="text-sm font-medium text-gray-300 hover:text-red-400 transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Connexion
              </Link>
              <Link 
                href="/auth/register" 
                className="text-sm font-bold bg-yellow-500 text-black px-4 py-2 rounded-full hover:bg-yellow-400 transition-transform hover:scale-105"
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
