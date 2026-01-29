import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import MyListView from "@/components/MyListView";

export const dynamic = 'force-dynamic';

export default async function MyListPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return <main className="min-h-screen bg-[#050505] p-20 text-white">Veuillez vous connecter.</main>;
  }

  // On récupère tout PostgreSQL
  const items = await prisma.watchlistItem.findMany({
    where: { user: { email: session.user.email } },
    include: { movie: true, book: true, game: true },
    orderBy: { addedAt: 'desc' }
  });

  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-10 tracking-tighter">Ma Collection</h1>
        <MyListView items={items} />
      </div>
    </main>
  );
}
