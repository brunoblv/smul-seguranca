import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// GET - Listar todas as unidades organizacionais
export async function GET(request: NextRequest) {
  try {
    // Dados hardcoded temporariamente para teste
    const unidades = [
      {
        id: 1,
        codigo: "ADESAMPA",
        nome: "Agência de Desenvolvimento Econômico de São Paulo",
        descricao: "Agência de Desenvolvimento Econômico",
        ativo: true,
        ordem: 1,
      },
      {
        id: 2,
        codigo: "AHM",
        nome: "Agência de Habitação Municipal",
        descricao: "Agência de Habitação",
        ativo: true,
        ordem: 2,
      },
      {
        id: 3,
        codigo: "AMLURB",
        nome: "Agência Municipal de Limpeza Urbana",
        descricao: "Agência de Limpeza Urbana",
        ativo: true,
        ordem: 3,
      },
      {
        id: 4,
        codigo: "CET",
        nome: "Companhia de Engenharia de Tráfego",
        descricao: "Companhia de Tráfego",
        ativo: true,
        ordem: 4,
      },
      {
        id: 5,
        codigo: "CGM",
        nome: "Controladoria Geral do Município",
        descricao: "Controladoria Geral",
        ativo: true,
        ordem: 5,
      },
      {
        id: 6,
        codigo: "CMSP",
        nome: "Câmara Municipal de São Paulo",
        descricao: "Câmara Municipal",
        ativo: true,
        ordem: 6,
      },
      {
        id: 7,
        codigo: "COHAB",
        nome: "Companhia Metropolitana de Habitação",
        descricao: "Companhia de Habitação",
        ativo: true,
        ordem: 7,
      },
      {
        id: 8,
        codigo: "FPETC",
        nome: "Fundação Paulistana de Educação, Tecnologia e Cultura",
        descricao: "Fundação Paulistana",
        ativo: true,
        ordem: 8,
      },
      {
        id: 9,
        codigo: "FTM",
        nome: "Fundação de Tecnologia Municipal",
        descricao: "Fundação de Tecnologia",
        ativo: true,
        ordem: 9,
      },
      {
        id: 10,
        codigo: "GIPB",
        nome: "Gabinete do Prefeito",
        descricao: "Gabinete do Prefeito",
        ativo: true,
        ordem: 10,
      },
      {
        id: 11,
        codigo: "HSPM",
        nome: "Hospital São Paulo Municipal",
        descricao: "Hospital Municipal",
        ativo: true,
        ordem: 11,
      },
      {
        id: 12,
        codigo: "ILUME",
        nome: "Instituto Luiz de Queiroz",
        descricao: "Instituto Luiz de Queiroz",
        ativo: true,
        ordem: 12,
      },
      {
        id: 13,
        codigo: "IPREM",
        nome: "Instituto de Previdência Municipal",
        descricao: "Instituto de Previdência",
        ativo: true,
        ordem: 13,
      },
      {
        id: 14,
        codigo: "PGM",
        nome: "Procuradoria Geral do Município",
        descricao: "Procuradoria Geral",
        ativo: true,
        ordem: 14,
      },
      {
        id: 15,
        codigo: "PRODAM",
        nome: "Empresa de Tecnologia da Informação e Comunicação",
        descricao: "Empresa de TI",
        ativo: true,
        ordem: 15,
      },
      {
        id: 16,
        codigo: "SECOM",
        nome: "Secretaria de Comunicação",
        descricao: "Secretaria de Comunicação",
        ativo: true,
        ordem: 16,
      },
      {
        id: 17,
        codigo: "SEHAB",
        nome: "Secretaria Municipal de Habitação",
        descricao: "Secretaria de Habitação",
        ativo: true,
        ordem: 17,
      },
      {
        id: 18,
        codigo: "SEME",
        nome: "Secretaria Municipal de Educação",
        descricao: "Secretaria de Educação",
        ativo: true,
        ordem: 18,
      },
      {
        id: 19,
        codigo: "SF",
        nome: "Secretaria da Fazenda",
        descricao: "Secretaria da Fazenda",
        ativo: true,
        ordem: 19,
      },
      {
        id: 20,
        codigo: "SFMSP",
        nome: "Secretaria Municipal de Finanças",
        descricao: "Secretaria de Finanças",
        ativo: true,
        ordem: 20,
      },
      {
        id: 21,
        codigo: "SGM",
        nome: "Secretaria Municipal de Governo",
        descricao: "Secretaria de Governo",
        ativo: true,
        ordem: 21,
      },
      {
        id: 22,
        codigo: "SIURB",
        nome: "Secretaria Municipal de Infraestrutura Urbana",
        descricao: "Secretaria de Infraestrutura",
        ativo: true,
        ordem: 22,
      },
      {
        id: 23,
        codigo: "SMADS",
        nome: "Secretaria Municipal de Assistência e Desenvolvimento Social",
        descricao: "Secretaria de Assistência Social",
        ativo: true,
        ordem: 23,
      },
      {
        id: 24,
        codigo: "SMC",
        nome: "Secretaria Municipal de Cultura",
        descricao: "Secretaria de Cultura",
        ativo: true,
        ordem: 24,
      },
      {
        id: 25,
        codigo: "SMDET",
        nome: "Secretaria Municipal de Desenvolvimento Econômico e Trabalho",
        descricao: "Secretaria de Desenvolvimento Econômico",
        ativo: true,
        ordem: 25,
      },
      {
        id: 26,
        codigo: "SMDHC",
        nome: "Secretaria Municipal de Direitos Humanos e Cidadania",
        descricao: "Secretaria de Direitos Humanos",
        ativo: true,
        ordem: 26,
      },
      {
        id: 27,
        codigo: "SMDP",
        nome: "Secretaria Municipal de Desenvolvimento Urbano",
        descricao: "Secretaria de Desenvolvimento Urbano",
        ativo: true,
        ordem: 27,
      },
      {
        id: 28,
        codigo: "SME",
        nome: "Secretaria Municipal de Esportes",
        descricao: "Secretaria de Esportes",
        ativo: true,
        ordem: 28,
      },
      {
        id: 29,
        codigo: "SMG",
        nome: "Secretaria Municipal de Gestão",
        descricao: "Secretaria de Gestão",
        ativo: true,
        ordem: 29,
      },
      {
        id: 30,
        codigo: "SMIT",
        nome: "Secretaria Municipal de Inovação e Tecnologia",
        descricao: "Secretaria de Inovação e Tecnologia",
        ativo: true,
        ordem: 30,
      },
      {
        id: 31,
        codigo: "SMJ",
        nome: "Secretaria Municipal de Justiça",
        descricao: "Secretaria de Justiça",
        ativo: true,
        ordem: 31,
      },
      {
        id: 32,
        codigo: "SMPED",
        nome: "Secretaria Municipal de Pessoa com Deficiência",
        descricao: "Secretaria de Pessoa com Deficiência",
        ativo: true,
        ordem: 32,
      },
      {
        id: 33,
        codigo: "SMRG",
        nome: "Secretaria Municipal de Relações Governamentais",
        descricao: "Secretaria de Relações Governamentais",
        ativo: true,
        ordem: 33,
      },
      {
        id: 34,
        codigo: "SMRI",
        nome: "Secretaria Municipal de Relações Internacionais",
        descricao: "Secretaria de Relações Internacionais",
        ativo: true,
        ordem: 34,
      },
      {
        id: 35,
        codigo: "SMS",
        nome: "Secretaria Municipal de Saúde",
        descricao: "Secretaria de Saúde",
        ativo: true,
        ordem: 35,
      },
      {
        id: 36,
        codigo: "SMSP",
        nome: "Secretaria Municipal de Segurança Pública",
        descricao: "Secretaria de Segurança Pública",
        ativo: true,
        ordem: 36,
      },
      {
        id: 37,
        codigo: "SMSU",
        nome: "Secretaria Municipal de Serviços Urbanos",
        descricao: "Secretaria de Serviços Urbanos",
        ativo: true,
        ordem: 37,
      },
      {
        id: 38,
        codigo: "SMT",
        nome: "Secretaria Municipal de Transportes",
        descricao: "Secretaria de Transportes",
        ativo: true,
        ordem: 38,
      },
      {
        id: 39,
        codigo: "SMTUR",
        nome: "Secretaria Municipal de Turismo",
        descricao: "Secretaria de Turismo",
        ativo: true,
        ordem: 39,
      },
      {
        id: 40,
        codigo: "SMUL",
        nome: "Secretaria Municipal de Urbanismo e Licenciamento",
        descricao: "Secretaria de Urbanismo",
        ativo: true,
        ordem: 40,
      },
      {
        id: 41,
        codigo: "SPDA",
        nome: "Secretaria Municipal de Proteção e Defesa do Animal",
        descricao: "Secretaria de Proteção Animal",
        ativo: true,
        ordem: 41,
      },
      {
        id: 42,
        codigo: "SPOBRAS",
        nome: "Secretaria Municipal de Obras",
        descricao: "Secretaria de Obras",
        ativo: true,
        ordem: 42,
      },
      {
        id: 43,
        codigo: "SPP",
        nome: "Secretaria Municipal de Planejamento",
        descricao: "Secretaria de Planejamento",
        ativo: true,
        ordem: 43,
      },
      {
        id: 44,
        codigo: "SPREGULA",
        nome: "Secretaria Municipal de Regulação",
        descricao: "Secretaria de Regulação",
        ativo: true,
        ordem: 44,
      },
      {
        id: 45,
        codigo: "SPTRANS",
        nome: "Secretaria Municipal de Transportes",
        descricao: "Secretaria de Transportes",
        ativo: true,
        ordem: 45,
      },
      {
        id: 46,
        codigo: "SPTURIS",
        nome: "Secretaria Municipal de Turismo",
        descricao: "Secretaria de Turismo",
        ativo: true,
        ordem: 46,
      },
      {
        id: 47,
        codigo: "SPURBANISMO",
        nome: "Secretaria Municipal de Urbanismo",
        descricao: "Secretaria de Urbanismo",
        ativo: true,
        ordem: 47,
      },
      {
        id: 48,
        codigo: "SVMA",
        nome: "Secretaria Municipal do Verde e Meio Ambiente",
        descricao: "Secretaria do Verde e Meio Ambiente",
        ativo: true,
        ordem: 48,
      },
      {
        id: 49,
        codigo: "TCMSP",
        nome: "Tribunal de Contas do Município de São Paulo",
        descricao: "Tribunal de Contas",
        ativo: true,
        ordem: 49,
      },
    ];

    return NextResponse.json({
      success: true,
      unidades,
      count: unidades.length,
    });
  } catch (error) {
    console.error("Erro ao buscar unidades organizacionais:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// POST - Criar nova unidade organizacional
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codigo, nome, descricao, ordem } = body;

    if (!codigo || !nome) {
      return NextResponse.json(
        {
          success: false,
          error: "Código e nome são obrigatórios",
        },
        { status: 400 }
      );
    }

    // Verificar se o código já existe
    const existing = await prisma.unidadeOrganizacional.findUnique({
      where: { codigo },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Código já existe",
        },
        { status: 400 }
      );
    }

    const unidade = await prisma.unidadeOrganizacional.create({
      data: {
        codigo,
        nome,
        descricao,
        ordem: ordem || 0,
        ativo: true,
      },
    });

    return NextResponse.json({
      success: true,
      unidade,
    });
  } catch (error) {
    console.error("Erro ao criar unidade organizacional:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
