import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const unidadesOrganizacionais = [
  {
    codigo: "ADESAMPA",
    nome: "Agência de Desenvolvimento Econômico de São Paulo",
    descricao: "Agência de Desenvolvimento Econômico",
  },
  {
    codigo: "AHM",
    nome: "Agência de Habitação Municipal",
    descricao: "Agência de Habitação",
  },
  {
    codigo: "AMLURB",
    nome: "Agência Municipal de Limpeza Urbana",
    descricao: "Agência de Limpeza Urbana",
  },
  {
    codigo: "CET",
    nome: "Companhia de Engenharia de Tráfego",
    descricao: "Companhia de Tráfego",
  },
  {
    codigo: "CGM",
    nome: "Controladoria Geral do Município",
    descricao: "Controladoria Geral",
  },
  {
    codigo: "CMSP",
    nome: "Câmara Municipal de São Paulo",
    descricao: "Câmara Municipal",
  },
  {
    codigo: "COHAB",
    nome: "Companhia Metropolitana de Habitação",
    descricao: "Companhia de Habitação",
  },
  {
    codigo: "FPETC",
    nome: "Fundação Paulistana de Educação, Tecnologia e Cultura",
    descricao: "Fundação Paulistana",
  },
  {
    codigo: "FTM",
    nome: "Fundação de Tecnologia Municipal",
    descricao: "Fundação de Tecnologia",
  },
  {
    codigo: "GIPB",
    nome: "Gabinete do Prefeito",
    descricao: "Gabinete do Prefeito",
  },
  {
    codigo: "HSPM",
    nome: "Hospital São Paulo Municipal",
    descricao: "Hospital Municipal",
  },
  {
    codigo: "ILUME",
    nome: "Instituto Luiz de Queiroz",
    descricao: "Instituto Luiz de Queiroz",
  },
  {
    codigo: "IPREM",
    nome: "Instituto de Previdência Municipal",
    descricao: "Instituto de Previdência",
  },
  {
    codigo: "PGM",
    nome: "Procuradoria Geral do Município",
    descricao: "Procuradoria Geral",
  },
  {
    codigo: "PRODAM",
    nome: "Empresa de Tecnologia da Informação e Comunicação",
    descricao: "Empresa de TI",
  },
  {
    codigo: "SECOM",
    nome: "Secretaria de Comunicação",
    descricao: "Secretaria de Comunicação",
  },
  {
    codigo: "SEHAB",
    nome: "Secretaria Municipal de Habitação",
    descricao: "Secretaria de Habitação",
  },
  {
    codigo: "SEME",
    nome: "Secretaria Municipal de Educação",
    descricao: "Secretaria de Educação",
  },
  {
    codigo: "SF",
    nome: "Secretaria da Fazenda",
    descricao: "Secretaria da Fazenda",
  },
  {
    codigo: "SFMSP",
    nome: "Secretaria Municipal de Finanças",
    descricao: "Secretaria de Finanças",
  },
  {
    codigo: "SGM",
    nome: "Secretaria Municipal de Governo",
    descricao: "Secretaria de Governo",
  },
  {
    codigo: "SIURB",
    nome: "Secretaria Municipal de Infraestrutura Urbana",
    descricao: "Secretaria de Infraestrutura",
  },
  {
    codigo: "SMADS",
    nome: "Secretaria Municipal de Assistência e Desenvolvimento Social",
    descricao: "Secretaria de Assistência Social",
  },
  {
    codigo: "SMC",
    nome: "Secretaria Municipal de Cultura",
    descricao: "Secretaria de Cultura",
  },
  {
    codigo: "SMDET",
    nome: "Secretaria Municipal de Desenvolvimento Econômico e Trabalho",
    descricao: "Secretaria de Desenvolvimento Econômico",
  },
  {
    codigo: "SMDHC",
    nome: "Secretaria Municipal de Direitos Humanos e Cidadania",
    descricao: "Secretaria de Direitos Humanos",
  },
  {
    codigo: "SMDP",
    nome: "Secretaria Municipal de Desenvolvimento Urbano",
    descricao: "Secretaria de Desenvolvimento Urbano",
  },
  {
    codigo: "SME",
    nome: "Secretaria Municipal de Esportes",
    descricao: "Secretaria de Esportes",
  },
  {
    codigo: "SMG",
    nome: "Secretaria Municipal de Gestão",
    descricao: "Secretaria de Gestão",
  },
  {
    codigo: "SMIT",
    nome: "Secretaria Municipal de Inovação e Tecnologia",
    descricao: "Secretaria de Inovação e Tecnologia",
  },
  {
    codigo: "SMJ",
    nome: "Secretaria Municipal de Justiça",
    descricao: "Secretaria de Justiça",
  },
  {
    codigo: "SMPED",
    nome: "Secretaria Municipal de Pessoa com Deficiência",
    descricao: "Secretaria de Pessoa com Deficiência",
  },
  {
    codigo: "SMRG",
    nome: "Secretaria Municipal de Relações Governamentais",
    descricao: "Secretaria de Relações Governamentais",
  },
  {
    codigo: "SMRI",
    nome: "Secretaria Municipal de Relações Internacionais",
    descricao: "Secretaria de Relações Internacionais",
  },
  {
    codigo: "SMS",
    nome: "Secretaria Municipal de Saúde",
    descricao: "Secretaria de Saúde",
  },
  {
    codigo: "SMSP",
    nome: "Secretaria Municipal de Segurança Pública",
    descricao: "Secretaria de Segurança Pública",
  },
  {
    codigo: "SMSU",
    nome: "Secretaria Municipal de Serviços Urbanos",
    descricao: "Secretaria de Serviços Urbanos",
  },
  {
    codigo: "SMT",
    nome: "Secretaria Municipal de Transportes",
    descricao: "Secretaria de Transportes",
  },
  {
    codigo: "SMTUR",
    nome: "Secretaria Municipal de Turismo",
    descricao: "Secretaria de Turismo",
  },
  {
    codigo: "SMUL",
    nome: "Secretaria Municipal de Urbanismo e Licenciamento",
    descricao: "Secretaria de Urbanismo",
  },
  {
    codigo: "SPDA",
    nome: "Secretaria Municipal de Proteção e Defesa do Animal",
    descricao: "Secretaria de Proteção Animal",
  },
  {
    codigo: "SPOBRAS",
    nome: "Secretaria Municipal de Obras",
    descricao: "Secretaria de Obras",
  },
  {
    codigo: "SPP",
    nome: "Secretaria Municipal de Planejamento",
    descricao: "Secretaria de Planejamento",
  },
  {
    codigo: "SPREGULA",
    nome: "Secretaria Municipal de Regulação",
    descricao: "Secretaria de Regulação",
  },
  {
    codigo: "SPTRANS",
    nome: "Secretaria Municipal de Transportes",
    descricao: "Secretaria de Transportes",
  },
  {
    codigo: "SPTURIS",
    nome: "Secretaria Municipal de Turismo",
    descricao: "Secretaria de Turismo",
  },
  {
    codigo: "SPURBANISMO",
    nome: "Secretaria Municipal de Urbanismo",
    descricao: "Secretaria de Urbanismo",
  },
  {
    codigo: "SVMA",
    nome: "Secretaria Municipal do Verde e Meio Ambiente",
    descricao: "Secretaria do Verde e Meio Ambiente",
  },
  {
    codigo: "TCMSP",
    nome: "Tribunal de Contas do Município de São Paulo",
    descricao: "Tribunal de Contas",
  },
];

async function main() {
  console.log("Iniciando seed das Unidades Organizacionais...");

  for (let i = 0; i < unidadesOrganizacionais.length; i++) {
    const unidade = unidadesOrganizacionais[i];

    try {
      await prisma.unidadeOrganizacional.upsert({
        where: { codigo: unidade.codigo },
        update: {
          nome: unidade.nome,
          descricao: unidade.descricao,
          ordem: i + 1,
          ativo: true,
        },
        create: {
          codigo: unidade.codigo,
          nome: unidade.nome,
          descricao: unidade.descricao,
          ordem: i + 1,
          ativo: true,
        },
      });

      console.log(`✓ ${unidade.codigo} - ${unidade.nome}`);
    } catch (error) {
      console.error(`✗ Erro ao inserir ${unidade.codigo}:`, error);
    }
  }

  console.log("Seed das Unidades Organizacionais concluído!");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
