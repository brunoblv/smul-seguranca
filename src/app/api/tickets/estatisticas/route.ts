import { NextRequest, NextResponse } from "next/server";
import { obterEstatisticasTickets } from "@/lib/ticket-database";

export async function GET(request: NextRequest) {
  try {
    const estatisticas = await obterEstatisticasTickets();

    return NextResponse.json({
      success: true,
      data: estatisticas,
    });
  } catch (error) {
    console.error("Erro ao obter estatísticas dos tickets:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
