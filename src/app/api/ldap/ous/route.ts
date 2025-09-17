import { NextRequest, NextResponse } from "next/server";

// OUs disponíveis para busca de usuários inativos - Prefeitura de São Paulo
const AVAILABLE_OUS = [
  {
    dn: "OU=ADESAMPA,DC=rede,DC=sp",
    name: "ADESAMPA",
    description: "Agência de Desenvolvimento Econômico",
  },
  {
    dn: "OU=AHM,DC=rede,DC=sp",
    name: "AHM",
    description: "Administração Hospitalar Municipal",
  },
  {
    dn: "OU=AMLURB,DC=rede,DC=sp",
    name: "AMLURB",
    description: "Agência Metropolitana de Urbanismo",
  },
  {
    dn: "OU=CET,DC=rede,DC=sp",
    name: "CET",
    description: "Companhia de Engenharia de Tráfego",
  },
  {
    dn: "OU=CGM,DC=rede,DC=sp",
    name: "CGM",
    description: "Controladoria Geral do Município",
  },
  {
    dn: "OU=CMSP,DC=rede,DC=sp",
    name: "CMSP",
    description: "Câmara Municipal de São Paulo",
  },
  {
    dn: "OU=COHAB,DC=rede,DC=sp",
    name: "COHAB",
    description: "Companhia Metropolitana de Habitação",
  },
  {
    dn: "OU=FPETC,DC=rede,DC=sp",
    name: "FPETC",
    description: "Fundação Paulistana de Educação, Tecnologia e Cultura",
  },
  {
    dn: "OU=FTM,DC=rede,DC=sp",
    name: "FTM",
    description: "Fundação de Tecnologia da Informação",
  },
  {
    dn: "OU=GIPB,DC=rede,DC=sp",
    name: "GIPB",
    description: "Gabinete do Prefeito",
  },
  {
    dn: "OU=HSPM,DC=rede,DC=sp",
    name: "HSPM",
    description: "Hospital São Paulo Municipal",
  },
  {
    dn: "OU=ILUME,DC=rede,DC=sp",
    name: "ILUME",
    description: "Instituto de Urbanismo e Meio Ambiente",
  },
  {
    dn: "OU=IPREM,DC=rede,DC=sp",
    name: "IPREM",
    description: "Instituto de Previdência Municipal",
  },
  {
    dn: "OU=PGM,DC=rede,DC=sp",
    name: "PGM",
    description: "Procuradoria Geral do Município",
  },
  {
    dn: "OU=PRODAM,DC=rede,DC=sp",
    name: "PRODAM",
    description: "Empresa de Tecnologia da Informação e Comunicação",
  },
  {
    dn: "OU=SECOM,DC=rede,DC=sp",
    name: "SECOM",
    description: "Secretaria de Comunicação",
  },
  {
    dn: "OU=SEHAB,DC=rede,DC=sp",
    name: "SEHAB",
    description: "Secretaria de Habitação",
  },
  {
    dn: "OU=SEME,DC=rede,DC=sp",
    name: "SEME",
    description: "Secretaria Municipal de Esportes",
  },
  {
    dn: "OU=SF,DC=rede,DC=sp",
    name: "SF",
    description: "Secretaria de Finanças",
  },
  {
    dn: "OU=SFMSP,DC=rede,DC=sp",
    name: "SFMSP",
    description: "Secretaria de Finanças Municipal",
  },
  {
    dn: "OU=SGM,DC=rede,DC=sp",
    name: "SGM",
    description: "Secretaria de Gestão",
  },
  {
    dn: "OU=SIURB,DC=rede,DC=sp",
    name: "SIURB",
    description: "Secretaria de Infraestrutura Urbana",
  },
  {
    dn: "OU=SMADS,DC=rede,DC=sp",
    name: "SMADS",
    description: "Secretaria Municipal de Assistência e Desenvolvimento Social",
  },
  {
    dn: "OU=SMC,DC=rede,DC=sp",
    name: "SMC",
    description: "Secretaria Municipal de Cultura",
  },
  {
    dn: "OU=SMDET,DC=rede,DC=sp",
    name: "SMDET",
    description: "Secretaria Municipal de Desenvolvimento Econômico e Trabalho",
  },
  {
    dn: "OU=SMDHC,DC=rede,DC=sp",
    name: "SMDHC",
    description: "Secretaria Municipal de Direitos Humanos e Cidadania",
  },
  {
    dn: "OU=SMDP,DC=rede,DC=sp",
    name: "SMDP",
    description: "Secretaria Municipal de Desenvolvimento Urbano",
  },
  {
    dn: "OU=SME,DC=rede,DC=sp",
    name: "SME",
    description: "Secretaria Municipal de Educação",
  },
  {
    dn: "OU=SMG,DC=rede,DC=sp",
    name: "SMG",
    description: "Secretaria Municipal de Governo",
  },
  {
    dn: "OU=SMIT,DC=rede,DC=sp",
    name: "SMIT",
    description: "Secretaria Municipal de Inovação e Tecnologia",
  },
  {
    dn: "OU=SMJ,DC=rede,DC=sp",
    name: "SMJ",
    description: "Secretaria Municipal de Justiça",
  },
  {
    dn: "OU=SMPED,DC=rede,DC=sp",
    name: "SMPED",
    description: "Secretaria Municipal de Pessoas com Deficiência",
  },
  {
    dn: "OU=SMRG,DC=rede,DC=sp",
    name: "SMRG",
    description: "Secretaria Municipal de Relações Governamentais",
  },
  {
    dn: "OU=SMRI,DC=rede,DC=sp",
    name: "SMRI",
    description: "Secretaria Municipal de Relações Internacionais",
  },
  {
    dn: "OU=SMS,DC=rede,DC=sp",
    name: "SMS",
    description: "Secretaria Municipal de Saúde",
  },
  {
    dn: "OU=SMSP,DC=rede,DC=sp",
    name: "SMSP",
    description: "Secretaria Municipal de Segurança Pública",
  },
  {
    dn: "OU=SMSU,DC=rede,DC=sp",
    name: "SMSU",
    description: "Secretaria Municipal de Segurança Urbana",
  },
  {
    dn: "OU=SMT,DC=rede,DC=sp",
    name: "SMT",
    description: "Secretaria Municipal de Transportes",
  },
  {
    dn: "OU=SMTUR,DC=rede,DC=sp",
    name: "SMTUR",
    description: "Secretaria Municipal de Turismo",
  },
  {
    dn: "OU=SMUL,DC=rede,DC=sp",
    name: "SMUL",
    description: "Secretaria Municipal de Urbanismo e Licenciamento",
  },
  {
    dn: "OU=SPDA,DC=rede,DC=sp",
    name: "SPDA",
    description: "São Paulo Desenvolvimento",
  },
  {
    dn: "OU=SPOBRAS,DC=rede,DC=sp",
    name: "SPOBRAS",
    description: "São Paulo Obras",
  },
  {
    dn: "OU=SPP,DC=rede,DC=sp",
    name: "SPP",
    description: "São Paulo Parcerias",
  },
  {
    dn: "OU=SPREGULA,DC=rede,DC=sp",
    name: "SPREGULA",
    description: "São Paulo Regulação",
  },
  {
    dn: "OU=SPTRANS,DC=rede,DC=sp",
    name: "SPTRANS",
    description: "São Paulo Transportes",
  },
  {
    dn: "OU=SPTURIS,DC=rede,DC=sp",
    name: "SPTURIS",
    description: "São Paulo Turismo",
  },
  {
    dn: "OU=SPURBANISMO,DC=rede,DC=sp",
    name: "SPURBANISMO",
    description: "São Paulo Urbanismo",
  },
  {
    dn: "OU=SVMA,DC=rede,DC=sp",
    name: "SVMA",
    description: "Secretaria do Verde e Meio Ambiente",
  },
  {
    dn: "OU=TCMSP,DC=rede,DC=sp",
    name: "TCMSP",
    description: "Tribunal de Contas do Município",
  },
];

interface OU {
  dn: string;
  name: string;
  description?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Listando OUs disponíveis para busca de usuários inativos...");

    const ous: OU[] = AVAILABLE_OUS;

    console.log(`Retornando ${ous.length} OUs disponíveis`);

    return NextResponse.json({
      ous,
      total: ous.length,
      source: "STATIC_OUS",
      message: "OUs disponíveis para busca de usuários inativos",
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
