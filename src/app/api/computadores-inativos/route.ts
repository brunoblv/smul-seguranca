import { NextRequest, NextResponse } from "next/server";
import {
  buscarComputadoresInativos,
  salvarComputadorInativo,
  obterEstatisticasComputadores,
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

// GET - Buscar computadores inativos
export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const diasMinimos = searchParams.get("diasMinimos");
    const departamento = searchParams.get("departamento");
    const sistemaOperacional = searchParams.get("sistemaOperacional");
    const estatisticas = searchParams.get("estatisticas");

    if (estatisticas === "true") {
      // Retornar estatísticas
      const stats = await obterEstatisticasComputadores();
      return NextResponse.json({ estatisticas: stats });
    }

    // Buscar computadores com filtros
    const computadores = await buscarComputadoresInativos({
      status: (status as Status) || undefined,
      diasMinimos: diasMinimos ? parseInt(diasMinimos) : undefined,
      departamento: departamento || undefined,
      sistemaOperacional: sistemaOperacional || undefined,
    });

    return NextResponse.json({
      computadores,
      total: computadores.length,
    });
  } catch (error) {
    console.error("Erro ao buscar computadores inativos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Salvar computadores inativos (batch)
export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const body = await request.json();
    const { computadores } = body;

    if (!computadores || !Array.isArray(computadores)) {
      return NextResponse.json(
        { error: "Lista de computadores é obrigatória" },
        { status: 400 }
      );
    }

    const resultados = [];

    for (const computador of computadores) {
      try {
        await salvarComputadorInativo({
          nome_computador: computador.nomeComputador,
          ip_address: computador.ipAddress,
          mac_address: computador.macAddress,
          departamento: computador.departamento,
          usuario_responsavel: computador.usuarioResponsavel,
          ultimo_login: computador.lastLogon,
          dias_inativos: computador.daysInactive,
          status: Status.PENDENTE,
          servidor_origem: computador.server,
          ou_origem: computador.ou,
          sistema_operacional: computador.sistemaOperacional,
          versao_so: computador.versaoSO,
        });

        resultados.push({
          nomeComputador: computador.nomeComputador,
          status: "salvo",
        });
      } catch (error) {
        console.error(
          `Erro ao salvar computador ${computador.nomeComputador}:`,
          error
        );
        resultados.push({
          nomeComputador: computador.nomeComputador,
          status: "erro",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      message: "Processamento concluído",
      resultados,
      total: computadores.length,
      sucessos: resultados.filter((r) => r.status === "salvo").length,
      erros: resultados.filter((r) => r.status === "erro").length,
    });
  } catch (error) {
    console.error("Erro ao processar computadores inativos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

