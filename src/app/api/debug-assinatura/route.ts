import { NextRequest, NextResponse } from "next/server";
import {
  initAssinaturaDatabase,
  buscarUsuariosAssinatura,
} from "@/lib/assinatura-database";

export async function GET(request: NextRequest) {
  try {
    console.log("Iniciando análise do banco de assinatura...");

    // Conectar ao banco
    const pool = await initAssinaturaDatabase();
    console.log("Conectado ao banco de assinatura com sucesso");

    // Verificar tabelas disponíveis
    const [tables] = await pool.execute("SHOW TABLES");
    console.log("Tabelas disponíveis:", tables);

    // Verificar estrutura da tabela usuarios se existir
    let usuariosStructure = null;
    let usuariosData = null;

    const tablesArray = tables as any[];
    const usuariosTable = tablesArray.find(
      (table) => Object.values(table)[0] === "usuarios"
    );

    if (usuariosTable) {
      console.log("Tabela 'usuarios' encontrada, analisando estrutura...");

      // Estrutura da tabela
      const [structure] = await pool.execute("DESCRIBE usuarios");
      usuariosStructure = structure;
      console.log("Estrutura da tabela usuarios:", structure);

      // Buscar alguns registros para análise
      const [data] = await pool.execute("SELECT * FROM usuarios LIMIT 5");
      usuariosData = data;
      console.log("Primeiros 5 registros da tabela usuarios:", data);
    } else {
      console.log("Tabela 'usuarios' não encontrada");
    }

    return NextResponse.json({
      success: true,
      message: "Análise do banco de assinatura concluída",
      data: {
        tables: tables,
        usuariosTable: usuariosTable ? "Encontrada" : "Não encontrada",
        usuariosStructure: usuariosStructure,
        usuariosData: usuariosData,
        totalTables: tablesArray.length,
      },
    });
  } catch (error) {
    console.error("Erro ao analisar banco de assinatura:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        message: "Falha ao conectar ou analisar o banco de assinatura",
      },
      { status: 500 }
    );
  }
}

