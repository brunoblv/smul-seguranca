import { NextRequest, NextResponse } from "next/server";
import { initSguDatabase } from "@/lib/sgu-database";

export async function GET(request: NextRequest) {
  try {
    const pool = await initSguDatabase();
    if (!pool) {
      return NextResponse.json(
        { success: false, message: "Erro ao conectar com o banco SGU" },
        { status: 500 }
      );
    }

    // Buscar todas as tabelas que seguem o padrão YYYY_MM
    const [tabelas] = await pool.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = 'SGU' 
       AND TABLE_NAME REGEXP '^[0-9]{4}_[0-9]{2}$'
       ORDER BY TABLE_NAME DESC`
    );

    const tabelasArray = tabelas as Array<{ TABLE_NAME: string }>;

    // Extrair o mês/ano do nome da tabela
    const mesesDisponiveis = tabelasArray.map((tabela) => {
      const nomeTabela = tabela.TABLE_NAME;

      // Se for formato YYYY_MM, converter para nome do mês
      if (nomeTabela.match(/^\d{4}_\d{2}$/)) {
        const [ano, mes] = nomeTabela.split("_");
        const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
        const dataFormatada = data.toLocaleString("pt-BR", {
          month: "long",
          year: "numeric",
        });

        return {
          valor: nomeTabela,
          label: dataFormatada,
          nomeTabela: nomeTabela,
        };
      }

      return {
        valor: nomeTabela,
        label: nomeTabela,
        nomeTabela: nomeTabela,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        tabelas: mesesDisponiveis,
        total: mesesDisponiveis.length,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar tabelas disponíveis:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
