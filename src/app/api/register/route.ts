import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;
    if (!email || !password) return NextResponse.json({ message: "Manquant" }, { status: 400 });
    
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ message: "Email pris" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });
    
    return NextResponse.json({ message: "Succès" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erreur" }, { status: 500 });
  }
}
