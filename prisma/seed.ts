import { PrismaClient, Status } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // Exemplo de dados para teste
  const usuariosExemplo = [
    {
      username: "joao.silva",
      nome: "João Silva",
      email: "joao.silva@smul.gov.br",
      departamento: "TI",
      ultimo_login: "2024-01-15",
      dias_inativos: 30,
      status: Status.PENDENTE,
      servidor_origem: "servidor1",
      ou_origem: "OU=Usuarios,DC=smul,DC=gov,DC=br",
    },
    {
      username: "maria.santos",
      nome: "Maria Santos",
      email: "maria.santos@smul.gov.br",
      departamento: "RH",
      ultimo_login: "2024-01-10",
      dias_inativos: 35,
      status: Status.EXONERADO,
      servidor_origem: "servidor1",
      ou_origem: "OU=Usuarios,DC=smul,DC=gov,DC=br",
    },
    {
      username: "pedro.oliveira",
      nome: "Pedro Oliveira",
      email: "pedro.oliveira@smul.gov.br",
      departamento: "Financeiro",
      ultimo_login: "2024-01-05",
      dias_inativos: 40,
      status: Status.TRANSFERIDO,
      servidor_origem: "servidor2",
      ou_origem: "OU=Usuarios,DC=smul,DC=gov,DC=br",
    },
    {
      username: "ana.coringa",
      nome: "Ana Coringa",
      email: "ana.coringa@smul.gov.br",
      departamento: "Administrativo",
      ultimo_login: "2024-01-20",
      dias_inativos: 25,
      status: Status.USUARIO_CORINGA,
      servidor_origem: "servidor1",
      ou_origem: "OU=Usuarios,DC=smul,DC=gov,DC=br",
    },
  ];

  // Inserir dados de exemplo
  for (const usuario of usuariosExemplo) {
    await prisma.usuarioInativo.upsert({
      where: { username: usuario.username },
      update: usuario,
      create: usuario,
    });
  }

  // Exemplo de dados para computadores
  const computadoresExemplo = [
    {
      nome_computador: "PC-TI-001",
      ip_address: "192.168.1.100",
      mac_address: "00:1B:44:11:3A:B7",
      departamento: "TI",
      usuario_responsavel: "joao.silva",
      ultimo_login: "2024-01-15",
      dias_inativos: 30,
      status: Status.PENDENTE,
      servidor_origem: "servidor1",
      ou_origem: "OU=Computadores,DC=smul,DC=gov,DC=br",
      sistema_operacional: "Windows",
      versao_so: "Windows 10 Pro",
    },
    {
      nome_computador: "PC-RH-002",
      ip_address: "192.168.1.101",
      mac_address: "00:1B:44:11:3A:B8",
      departamento: "RH",
      usuario_responsavel: "maria.santos",
      ultimo_login: "2024-01-10",
      dias_inativos: 35,
      status: Status.EXONERADO,
      servidor_origem: "servidor1",
      ou_origem: "OU=Computadores,DC=smul,DC=gov,DC=br",
      sistema_operacional: "Windows",
      versao_so: "Windows 11 Pro",
    },
    {
      nome_computador: "PC-FIN-003",
      ip_address: "192.168.1.102",
      mac_address: "00:1B:44:11:3A:B9",
      departamento: "Financeiro",
      usuario_responsavel: "pedro.oliveira",
      ultimo_login: "2024-01-05",
      dias_inativos: 40,
      status: Status.TRANSFERIDO,
      servidor_origem: "servidor2",
      ou_origem: "OU=Computadores,DC=smul,DC=gov,DC=br",
      sistema_operacional: "Linux",
      versao_so: "Ubuntu 22.04 LTS",
    },
    {
      nome_computador: "PC-ADM-004",
      ip_address: "192.168.1.103",
      mac_address: "00:1B:44:11:3A:BA",
      departamento: "Administrativo",
      usuario_responsavel: "ana.coringa",
      ultimo_login: "2024-01-20",
      dias_inativos: 25,
      status: Status.USUARIO_CORINGA,
      servidor_origem: "servidor1",
      ou_origem: "OU=Computadores,DC=smul,DC=gov,DC=br",
      sistema_operacional: "Windows",
      versao_so: "Windows 10 Enterprise",
    },
  ];

  // Inserir dados de exemplo de computadores
  for (const computador of computadoresExemplo) {
    await prisma.computadorInativo.upsert({
      where: { nome_computador: computador.nome_computador },
      update: computador,
      create: computador,
    });
  }

  console.log("Seed concluído com sucesso!");
  console.log(`${usuariosExemplo.length} usuários de exemplo foram inseridos.`);
  console.log(
    `${computadoresExemplo.length} computadores de exemplo foram inseridos.`
  );
}

main()
  .catch((e) => {
    console.error("Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
