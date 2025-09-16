import { NextRequest, NextResponse } from "next/server";
import { buscarDepartamentoSgu, initSguDatabase } from "@/lib/sgu-database";

export async function GET(request: NextRequest) {
  try {
    console.log("=== TESTE DE CONEXÃO SGU ===");

    // Testar conexão
    console.log("1. Testando conexão com o banco SGU...");
    await initSguDatabase();
    console.log("✅ Conexão estabelecida com sucesso!");

    // Buscar departamento do usuário d854440
    console.log("2. Buscando departamento do usuário d854440...");
    const departamento = await buscarDepartamentoSgu("d854440");

    console.log("3. Resultado da busca:");
    console.log(`   Usuário: d854440`);
    console.log(`   Departamento: ${departamento || "Não encontrado"}`);

    return NextResponse.json({
      success: true,
      message: "Teste de conexão SGU realizado com sucesso",
      data: {
        usuario: "d854440",
        departamento: departamento,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro no teste de conexão SGU:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro na conexão com o banco SGU",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
