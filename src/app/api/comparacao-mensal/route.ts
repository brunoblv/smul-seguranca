import { NextRequest, NextResponse } from "next/server";
import { initSguDatabase } from "@/lib/sgu-database";

interface UsuarioSgu {
  cpID: number;
  cpRF: string;
  cpNome: string;
  cpUnid: string;
  cpnomesetor2: string;
  cpEspecie?: string;
  sigla?: string;
  nome_unidade?: string;
}

interface ComparacaoResultado {
  exonerados: UsuarioSgu[];
  transferidos: Array<{
    usuario: UsuarioSgu;
    unidade_anterior: string;
    unidade_atual: string;
    sigla_anterior?: string;
    sigla_atual?: string;
  }>;
  total_exonerados: number;
  total_transferidos: number;
}

export async function POST(request: NextRequest) {
  try {
    const { mesAtual, mesAnterior, filtros } = await request.json();

    if (!mesAtual || !mesAnterior) {
      return NextResponse.json(
        { success: false, message: "Mês atual e anterior são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se as tabelas existem
    const pool = await initSguDatabase();
    if (!pool) {
      return NextResponse.json(
        { success: false, message: "Erro ao conectar com o banco SGU" },
        { status: 500 }
      );
    }

    // Primeiro, vamos listar todas as tabelas que seguem o padrão YYYY_MM
    const [todasTabelas] = await pool.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = 'SGU' 
       AND TABLE_NAME REGEXP '^[0-9]{4}_[0-9]{2}$'
       ORDER BY TABLE_NAME DESC`
    );

    const tabelasDisponiveis = (
      todasTabelas as Array<{ TABLE_NAME: string }>
    ).map((t) => t.TABLE_NAME);

    console.log("Tabelas disponíveis:", tabelasDisponiveis);
    console.log("Procurando por:", mesAtual, mesAnterior);

    // Verificar se as tabelas específicas existem
    const tabelaAtual = mesAtual;
    const tabelaAnterior = mesAnterior;

    if (!tabelasDisponiveis.includes(tabelaAtual)) {
      return NextResponse.json(
        {
          success: false,
          message: `Tabela do mês atual (${tabelaAtual}) não encontrada. Tabelas disponíveis: ${tabelasDisponiveis
            .slice(0, 5)
            .join(", ")}...`,
        },
        { status: 404 }
      );
    }

    if (!tabelasDisponiveis.includes(tabelaAnterior)) {
      return NextResponse.json(
        {
          success: false,
          message: `Tabela do mês anterior (${tabelaAnterior}) não encontrada. Tabelas disponíveis: ${tabelasDisponiveis
            .slice(0, 5)
            .join(", ")}...`,
        },
        { status: 404 }
      );
    }

    // Buscar usuários do mês anterior
    const [usuariosAnterior] = await pool.execute(
      `SELECT 
        t.cpID,
        t.cpRF,
        t.cpNome,
        t.cpUnid,
        t.cpnomesetor2,
        u.sigla,
        u.nome as nome_unidade
      FROM ${tabelaAnterior} t
      LEFT JOIN tblUnidades u ON t.cpUnid = u.uid`
    );

    // Buscar usuários do mês atual
    const [usuariosAtual] = await pool.execute(
      `SELECT 
        t.cpID,
        t.cpRF,
        t.cpNome,
        t.cpUnid,
        t.cpnomesetor2,
        t.cpEspecie,
        u.sigla,
        u.nome as nome_unidade
      FROM ${tabelaAtual} t
      LEFT JOIN tblUnidades u ON t.cpUnid = u.uid`
    );

    const usuariosAnteriorArray = usuariosAnterior as UsuarioSgu[];
    const usuariosAtualArray = usuariosAtual as UsuarioSgu[];

    console.log("Usuários do mês atual carregados:", usuariosAtualArray.length);
    console.log("Primeiros 5 usuários atuais:", usuariosAtualArray.slice(0, 5));
    console.log(
      "Campos disponíveis no primeiro usuário:",
      Object.keys(usuariosAtualArray[0] || {})
    );

    console.log(
      `Usuários mês anterior (${tabelaAnterior}):`,
      usuariosAnteriorArray.length
    );
    console.log(
      `Usuários mês atual (${tabelaAtual}):`,
      usuariosAtualArray.length
    );

    // Criar mapas para facilitar a busca (usando cpRF como identificador único)
    const mapaAtual = new Map(usuariosAtualArray.map((u) => [u.cpRF, u]));

    const mapaAnterior = new Map(usuariosAnteriorArray.map((u) => [u.cpRF, u]));

    // Encontrar usuários exonerados (estavam no anterior, não estão no atual)
    const exonerados: UsuarioSgu[] = usuariosAnteriorArray.filter(
      (usuario) => !mapaAtual.has(usuario.cpRF)
    );

    // Encontrar usuários transferidos (têm cpEspecie = "Remocao" na tabela atual)
    const transferidos: Array<{
      usuario: UsuarioSgu;
      unidade_anterior: string;
      unidade_atual: string;
      sigla_anterior?: string;
      sigla_atual?: string;
    }> = [];

    // Contar usuários com cpEspecie = "Remocao" (testando diferentes variações)
    const usuariosComRemocao1 = usuariosAtualArray.filter(
      (u) => u.cpEspecie === "Remocao"
    );
    const usuariosComRemocao2 = usuariosAtualArray.filter(
      (u) => u.cpEspecie === "REMOCAO"
    );
    const usuariosComRemocao3 = usuariosAtualArray.filter(
      (u) => u.cpEspecie && u.cpEspecie.toLowerCase().includes("remocao")
    );

    // Usar a variação que encontrar usuários
    const usuariosComRemocao =
      usuariosComRemocao3.length > 0
        ? usuariosComRemocao3
        : usuariosComRemocao2.length > 0
        ? usuariosComRemocao2
        : usuariosComRemocao1;

    usuariosComRemocao.forEach((usuarioAtual) => {
      const usuarioAnterior = mapaAnterior.get(usuarioAtual.cpRF);

      // Limpar siglas para comparação
      const siglaAtualLimpa = usuarioAtual.sigla
        ? usuarioAtual.sigla.trim().replace(/[\r\n\t\0]/g, "")
        : null;
      const siglaAnteriorLimpa = usuarioAnterior?.sigla
        ? usuarioAnterior.sigla.trim().replace(/[\r\n\t\0]/g, "")
        : null;

      // Só adicionar se as siglas forem diferentes
      if (siglaAtualLimpa !== siglaAnteriorLimpa) {
        transferidos.push({
          usuario: usuarioAtual,
          unidade_anterior: usuarioAnterior
            ? usuarioAnterior.nome_unidade || usuarioAnterior.cpnomesetor2
            : "Unidade anterior não encontrada",
          unidade_atual: usuarioAtual.nome_unidade || usuarioAtual.cpnomesetor2,
          sigla_anterior: siglaAnteriorLimpa,
          sigla_atual: siglaAtualLimpa,
        });
      }
    });

    const resultado: ComparacaoResultado = {
      exonerados,
      transferidos,
      total_exonerados: exonerados.length,
      total_transferidos: transferidos.length,
    };

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error("Erro na comparação mensal:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
