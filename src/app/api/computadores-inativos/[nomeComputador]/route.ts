import { NextRequest, NextResponse } from "next/server";
import {
  atualizarStatusComputador,
  buscarComputadorPorNome,
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

// PUT - Atualizar status do computador
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ nomeComputador: string }> }
) {
  try {
    await ensureDatabase();

    const { nomeComputador } = await params;
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

    // Verificar se computador existe
    const computador = await buscarComputadorPorNome(nomeComputador);
    if (!computador) {
      return NextResponse.json(
        { error: "Computador não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar status
    await atualizarStatusComputador(nomeComputador, status as Status);

    return NextResponse.json({
      message: "Status atualizado com sucesso",
      nomeComputador,
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

// GET - Buscar computador específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nomeComputador: string }> }
) {
  try {
    await ensureDatabase();

    const { nomeComputador } = await params;
    const computador = await buscarComputadorPorNome(nomeComputador);

    if (!computador) {
      return NextResponse.json(
        { error: "Computador não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ computador });
  } catch (error) {
    console.error("Erro ao buscar computador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

