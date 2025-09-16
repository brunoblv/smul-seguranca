import { NextRequest, NextResponse } from "next/server";
import {
  atualizarStatusUsuario,
  buscarUsuarioPorUsername,
  initDatabase,
} from "@/lib/database";
import { Status } from "@prisma/client";

// Inicializar banco na primeira execução
let dbInitialized = false;
async function ensureDatabase() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// PUT - Atualizar status do usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await ensureDatabase();

    const { username } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status é obrigatório" },
        { status: 400 }
      );
    }

    const statusValidos = Object.values(Status);

    if (!statusValidos.includes(status as Status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    // Verificar se usuário existe
    const usuario = await buscarUsuarioPorUsername(username);
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar status
    await atualizarStatusUsuario(username, status as Status);

    return NextResponse.json({
      message: "Status atualizado com sucesso",
      username,
      status,
    });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// GET - Buscar usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await ensureDatabase();

    const { username } = await params;
    const usuario = await buscarUsuarioPorUsername(username);

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
