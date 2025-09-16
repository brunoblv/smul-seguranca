import { NextRequest, NextResponse } from "next/server";

// Sistema agora pesquisa em toda a rede SP - não há mais OUs específicas
const REDE_SP_OUS = [
  "REDE_SP", // Indica busca em toda a rede SP
];

interface OU {
  dn: string;
  name: string;
  description?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log(
      "Sistema agora pesquisa em toda a rede SP - sem filtro de OUs..."
    );

    // Retorna apenas uma opção indicando busca em toda a rede SP
    const ous: OU[] = REDE_SP_OUS.map((ouName) => ({
      dn: `DC=rede,DC=sp`,
      name: ouName,
      description: `Busca em toda a rede SP - sem filtro de OUs`,
    }));

    console.log(`Sistema configurado para busca em toda a rede SP`);

    return NextResponse.json({
      ous,
      total: ous.length,
      source: "REDE_SP_SEARCH",
      message:
        "Sistema configurado para pesquisar em toda a rede SP sem filtro de OUs",
    });
  } catch (error) {
    console.error("Erro na API de listagem de OUs:", error);

    return NextResponse.json(
      {
        error: "Erro interno do servidor ao buscar OUs",
        ous: [],
      },
      { status: 500 }
    );
  }
}
