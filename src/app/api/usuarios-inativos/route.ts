import { NextRequest, NextResponse } from "next/server";
import {
  buscarUsuariosInativos,
  salvarUsuarioInativo,
  atualizarStatusUsuario,
  obterEstatisticas,
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

// GET - Buscar usuários inativos
export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const diasMinimos = searchParams.get("diasMinimos");
    const departamento = searchParams.get("departamento");
    const stats = searchParams.get("stats") === "true";

    if (stats) {
      // Retornar estatísticas
      const estatisticas = await obterEstatisticas();
      return NextResponse.json({ estatisticas });
    }

    // Buscar usuários com filtros
    const usuarios = await buscarUsuariosInativos({
      status: (status as Status) || undefined,
      diasMinimos: diasMinimos ? parseInt(diasMinimos) : undefined,
      departamento: departamento || undefined,
    });

    return NextResponse.json({
      usuarios,
      total: usuarios.length,
    });
  } catch (error) {
    console.error("Erro na API de usuários inativos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Salvar usuários inativos (vindos da busca)
export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const body = await request.json();
    const { usuarios } = body;

    if (!usuarios || !Array.isArray(usuarios)) {
      return NextResponse.json(
        { error: "Lista de usuários é obrigatória" },
        { status: 400 }
      );
    }

    const resultados = [];

    for (const usuario of usuarios) {
      try {
        await salvarUsuarioInativo({
          username: usuario.username,
          nome: usuario.displayName || usuario.username,
          email: usuario.email,
          departamento: usuario.department,
          departamento_sgu: usuario.departmentSgu,
          ultimo_login: usuario.lastLogon,
          dias_inativos: usuario.daysInactive,
          status: Status.PENDENTE,
          servidor_origem: usuario.server,
          ou_origem: usuario.ou,
        });

        resultados.push({ username: usuario.username, status: "salvo" });
      } catch (error) {
        console.error(`Erro ao salvar usuário ${usuario.username}:`, error);
        resultados.push({
          username: usuario.username,
          status: "erro",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      message: `${resultados.length} usuários processados`,
      resultados,
    });
  } catch (error) {
    console.error("Erro na API de salvamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
