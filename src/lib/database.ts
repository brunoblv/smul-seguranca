import { prisma } from "./prisma";
import { Status } from "@prisma/client";

// Interface para usuário inativo (compatível com o Prisma)
export interface UsuarioInativo {
  id?: number;
  username: string;
  nome: string;
  email?: string;
  departamento?: string;
  departamento_sgu?: string;
  ultimo_login: string;
  dias_inativos: number;
  status: Status;
  data_criacao: Date;
  data_atualizacao: Date;
  servidor_origem: string;
  ou_origem: string;
}

// Interface para computador inativo (compatível com o Prisma)
export interface ComputadorInativo {
  id?: number;
  nome_computador: string;
  ip_address?: string;
  mac_address?: string;
  departamento?: string;
  departamento_sgu?: string;
  usuario_responsavel?: string;
  ultimo_login: string;
  dias_inativos: number;
  status: Status;
  data_criacao: Date;
  data_atualizacao: Date;
  servidor_origem: string;
  ou_origem: string;
  sistema_operacional?: string;
  versao_so?: string;
}

// Inicializar banco de dados
export async function initDatabase() {
  try {
    // Conectar ao banco de dados
    await prisma.$connect();
    console.log("Banco de dados inicializado com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    throw error;
  }
}

// Salvar usuário inativo
export async function salvarUsuarioInativo(
  usuario: Omit<UsuarioInativo, "id" | "data_criacao" | "data_atualizacao">
) {
  try {
    await prisma.usuarioInativo.upsert({
      where: { username: usuario.username },
      update: {
        nome: usuario.nome,
        email: usuario.email,
        departamento: usuario.departamento,
        departamento_sgu: usuario.departamento_sgu,
        ultimo_login: usuario.ultimo_login,
        dias_inativos: usuario.dias_inativos,
        status: usuario.status,
        servidor_origem: usuario.servidor_origem,
        ou_origem: usuario.ou_origem,
      },
      create: {
        username: usuario.username,
        nome: usuario.nome,
        email: usuario.email,
        departamento: usuario.departamento,
        departamento_sgu: usuario.departamento_sgu,
        ultimo_login: usuario.ultimo_login,
        dias_inativos: usuario.dias_inativos,
        status: usuario.status,
        servidor_origem: usuario.servidor_origem,
        ou_origem: usuario.ou_origem,
      },
    });

    return true;
  } catch (error) {
    console.error("Erro ao salvar usuário inativo:", error);
    throw error;
  }
}

// Buscar todos os usuários inativos
export async function buscarUsuariosInativos(filtros?: {
  status?: Status;
  diasMinimos?: number;
  departamento?: string;
}) {
  try {
    const where: {
      status?: Status;
      dias_inativos?: { gte: number };
      departamento?: { contains: string };
    } = {};

    if (filtros?.status) {
      where.status = filtros.status;
    }

    if (filtros?.diasMinimos) {
      where.dias_inativos = {
        gte: filtros.diasMinimos,
      };
    }

    if (filtros?.departamento) {
      where.departamento = {
        contains: filtros.departamento,
      };
    }

    const usuarios = await prisma.usuarioInativo.findMany({
      where,
      orderBy: [{ dias_inativos: "desc" }, { data_atualizacao: "desc" }],
    });

    return usuarios as UsuarioInativo[];
  } catch (error) {
    console.error("Erro ao buscar usuários inativos:", error);
    throw error;
  }
}

// Atualizar status do usuário
export async function atualizarStatusUsuario(username: string, status: Status) {
  try {
    await prisma.usuarioInativo.update({
      where: { username },
      data: { status },
    });

    return true;
  } catch (error) {
    console.error("Erro ao atualizar status do usuário:", error);
    throw error;
  }
}

// Buscar usuário por username
export async function buscarUsuarioPorUsername(username: string) {
  try {
    const usuario = await prisma.usuarioInativo.findUnique({
      where: { username },
    });
    return usuario as UsuarioInativo | undefined;
  } catch (error) {
    console.error("Erro ao buscar usuário por username:", error);
    throw error;
  }
}

// Estatísticas
export async function obterEstatisticas() {
  try {
    const [
      total,
      pendentes,
      exonerados,
      transferidos,
      lip,
      afastados,
      licencaMedica,
      usuarioCoringa,
      mediaDiasInativos,
    ] = await Promise.all([
      prisma.usuarioInativo.count(),
      prisma.usuarioInativo.count({ where: { status: "PENDENTE" } }),
      prisma.usuarioInativo.count({ where: { status: "EXONERADO" } }),
      prisma.usuarioInativo.count({ where: { status: "TRANSFERIDO" } }),
      prisma.usuarioInativo.count({ where: { status: "LIP" } }),
      prisma.usuarioInativo.count({
        where: { status: "AFASTADO_PARA_OUTRO_ORGAO" },
      }),
      prisma.usuarioInativo.count({ where: { status: "LICENCA_MEDICA" } }),
      prisma.usuarioInativo.count({
        where: { status: "USUARIO_CORINGA" as Status },
      }),
      prisma.usuarioInativo.aggregate({
        _avg: { dias_inativos: true },
      }),
    ]);

    return {
      total,
      pendentes,
      exonerados,
      transferidos,
      lip,
      afastados,
      licenca_medica: licencaMedica,
      usuario_coringa: usuarioCoringa,
      media_dias_inativos: mediaDiasInativos._avg.dias_inativos || 0,
    };
  } catch (error) {
    console.error("Erro ao obter estatísticas:", error);
    throw error;
  }
}

// ===== FUNÇÕES PARA COMPUTADORES INATIVOS =====

// Salvar computador inativo
export async function salvarComputadorInativo(
  computador: Omit<
    ComputadorInativo,
    "id" | "data_criacao" | "data_atualizacao"
  >
) {
  try {
    await prisma.computadorInativo.upsert({
      where: { nome_computador: computador.nome_computador },
      update: {
        ip_address: computador.ip_address,
        mac_address: computador.mac_address,
        departamento: computador.departamento,
        departamento_sgu: computador.departamento_sgu,
        usuario_responsavel: computador.usuario_responsavel,
        ultimo_login: computador.ultimo_login,
        dias_inativos: computador.dias_inativos,
        status: computador.status,
        servidor_origem: computador.servidor_origem,
        ou_origem: computador.ou_origem,
        sistema_operacional: computador.sistema_operacional,
        versao_so: computador.versao_so,
      },
      create: {
        nome_computador: computador.nome_computador,
        ip_address: computador.ip_address,
        mac_address: computador.mac_address,
        departamento: computador.departamento,
        departamento_sgu: computador.departamento_sgu,
        usuario_responsavel: computador.usuario_responsavel,
        ultimo_login: computador.ultimo_login,
        dias_inativos: computador.dias_inativos,
        status: computador.status,
        servidor_origem: computador.servidor_origem,
        ou_origem: computador.ou_origem,
        sistema_operacional: computador.sistema_operacional,
        versao_so: computador.versao_so,
      },
    });

    return true;
  } catch (error) {
    console.error("Erro ao salvar computador inativo:", error);
    throw error;
  }
}

// Buscar todos os computadores inativos
export async function buscarComputadoresInativos(filtros?: {
  status?: Status;
  diasMinimos?: number;
  departamento?: string;
  sistemaOperacional?: string;
}) {
  try {
    const where: {
      status?: Status;
      dias_inativos?: { gte: number };
      departamento?: { contains: string };
      sistema_operacional?: { contains: string };
    } = {};

    if (filtros?.status) {
      where.status = filtros.status;
    }

    if (filtros?.diasMinimos) {
      where.dias_inativos = {
        gte: filtros.diasMinimos,
      };
    }

    if (filtros?.departamento) {
      where.departamento = {
        contains: filtros.departamento,
      };
    }

    if (filtros?.sistemaOperacional) {
      where.sistema_operacional = {
        contains: filtros.sistemaOperacional,
      };
    }

    const computadores = await prisma.computadorInativo.findMany({
      where,
      orderBy: [{ dias_inativos: "desc" }, { data_atualizacao: "desc" }],
    });

    return computadores as ComputadorInativo[];
  } catch (error) {
    console.error("Erro ao buscar computadores inativos:", error);
    throw error;
  }
}

// Atualizar status do computador
export async function atualizarStatusComputador(
  nomeComputador: string,
  status: Status
) {
  try {
    await prisma.computadorInativo.update({
      where: { nome_computador: nomeComputador },
      data: { status },
    });

    return true;
  } catch (error) {
    console.error("Erro ao atualizar status do computador:", error);
    throw error;
  }
}

// Buscar computador por nome
export async function buscarComputadorPorNome(nomeComputador: string) {
  try {
    const computador = await prisma.computadorInativo.findUnique({
      where: { nome_computador: nomeComputador },
    });
    return computador as ComputadorInativo | undefined;
  } catch (error) {
    console.error("Erro ao buscar computador por nome:", error);
    throw error;
  }
}

// Estatísticas de computadores
export async function obterEstatisticasComputadores() {
  try {
    const [
      total,
      pendentes,
      exonerados,
      transferidos,
      lip,
      afastados,
      licencaMedica,
      usuarioCoringa,
      mediaDiasInativos,
    ] = await Promise.all([
      prisma.computadorInativo.count(),
      prisma.computadorInativo.count({
        where: { status: "PENDENTE" },
      }),
      prisma.computadorInativo.count({
        where: { status: "EXONERADO" },
      }),
      prisma.computadorInativo.count({
        where: { status: "TRANSFERIDO" },
      }),
      prisma.computadorInativo.count({
        where: { status: "LIP" },
      }),
      prisma.computadorInativo.count({
        where: { status: "AFASTADO_PARA_OUTRO_ORGAO" },
      }),
      prisma.computadorInativo.count({
        where: { status: "LICENCA_MEDICA" },
      }),
      prisma.computadorInativo.count({
        where: { status: "USUARIO_CORINGA" as Status },
      }),
      prisma.computadorInativo.aggregate({
        _avg: { dias_inativos: true },
      }),
    ]);

    return {
      total,
      pendentes,
      exonerados,
      transferidos,
      lip,
      afastados,
      licenca_medica: licencaMedica,
      usuario_coringa: usuarioCoringa,
      media_dias_inativos: mediaDiasInativos._avg.dias_inativos || 0,
    };
  } catch (error) {
    console.error("Erro ao obter estatísticas de computadores:", error);
    throw error;
  }
}

// Fechar conexão
export async function fecharConexao() {
  await prisma.$disconnect();
}
