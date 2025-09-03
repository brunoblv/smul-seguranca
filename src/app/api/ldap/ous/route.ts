import { NextRequest, NextResponse } from "next/server";

// Lista fixa de OUs do sistema SMUL
const SMUL_OUS = [
  "ADESAMPA",
  "AHM",
  "AMLURB",
  "CET",
  "CGM",
  "CMSP",
  "COHAB",
  "FPETC",
  "FTM",
  "GIPB",
  "HSPM",
  "ILUME",
  "IPREM",
  "PGM",
  "PRODAM",
  "SECOM",
  "SEHAB",
  "SEME",
  "SF",
  "SFMSP",
  "AGM",
  "SIURB",
  "SMADS",
  "SMC",
  "SMDET",
  "SMDHC",
  "SMDP",
  "SME",
  "SMG",
  "SMIT",
  "SMJ",
  "SMPED",
  "SMRG",
  "SMRI",
  "SMS",
  "SMSP",
  "SMSU",
  "SMT",
  "SMTUR",
  "SMUL",
  "SPDA",
  "SPREGULA",
  "SPTRANS",
  "SPTURIS",
  "SPURBANISMO",
  "SVMA",
  "TCMSP",
];

interface OU {
  dn: string;
  name: string;
  description?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Retornando lista fixa de OUs do SMUL...");

    // Converte a lista de nomes para o formato esperado
    const ous: OU[] = SMUL_OUS.map((ouName) => ({
      dn: `OU=${ouName},DC=rede,DC=sp`,
      name: ouName,
      description: `Organização ${ouName} - SMUL`,
    }));

    // Ordena por nome
    ous.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`Retornando ${ous.length} OUs do SMUL`);

    return NextResponse.json({
      ous,
      total: ous.length,
      source: "SMUL_OUS_LIST",
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
