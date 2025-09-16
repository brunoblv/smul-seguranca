import {
  PrismaClient,
  StatusLDAP,
  StatusSGU,
  StatusTicket,
} from "@prisma/client";

const prisma = new PrismaClient();

export interface TicketData {
  username: string;
  nome: string;
  email?: string;
  departamento?: string;
  empresa?: string;
  status_ldap: StatusLDAP;
  ultimo_login?: string;
  dias_sem_logar?: number;
  status_sgu: StatusSGU;
  setor_sgu?: string;
  status_ticket?: StatusTicket;
  observacoes?: string;
  servidor_origem?: string;
  ou_origem?: string;
}

export interface LDAPUserInfo {
  exists: boolean;
  nome?: string;
  email?: string;
  departamento?: string;
  empresa?: string;
  status_ldap: StatusLDAP;
  ultimo_login?: string;
  dias_sem_logar?: number;
  servidor_origem?: string;
  ou_origem?: string;
}

export interface SGUUserInfo {
  status_sgu: StatusSGU;
  setor_sgu?: string;
}

// Criar ou atualizar ticket
export async function criarOuAtualizarTicket(
  ticketData: TicketData
): Promise<any> {
  try {
    const ticket = await prisma.ticket.upsert({
      where: {
        username: ticketData.username,
      },
      update: {
        nome: ticketData.nome,
        email: ticketData.email,
        departamento: ticketData.departamento,
        empresa: ticketData.empresa,
        status_ldap: ticketData.status_ldap,
        ultimo_login: ticketData.ultimo_login,
        dias_sem_logar: ticketData.dias_sem_logar,
        status_sgu: ticketData.status_sgu,
        setor_sgu: ticketData.setor_sgu,
        status_ticket: ticketData.status_ticket || StatusTicket.PENDENTE,
        fechado: ticketData.fechado || false,
        observacoes: ticketData.observacoes,
        servidor_origem: ticketData.servidor_origem,
        ou_origem: ticketData.ou_origem,
        data_atualizacao: new Date(),
      },
      create: {
        username: ticketData.username,
        nome: ticketData.nome,
        email: ticketData.email,
        departamento: ticketData.departamento,
        empresa: ticketData.empresa,
        status_ldap: ticketData.status_ldap,
        ultimo_login: ticketData.ultimo_login,
        dias_sem_logar: ticketData.dias_sem_logar,
        status_sgu: ticketData.status_sgu,
        setor_sgu: ticketData.setor_sgu,
        status_ticket: ticketData.status_ticket || StatusTicket.PENDENTE,
        fechado: ticketData.fechado || false,
        observacoes: ticketData.observacoes,
        servidor_origem: ticketData.servidor_origem,
        ou_origem: ticketData.ou_origem,
      },
    });

    return ticket;
  } catch (error) {
    console.error("Erro ao criar/atualizar ticket:", error);
    throw error;
  }
}

// Buscar ticket por username
export async function buscarTicket(username: string): Promise<any | null> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: {
        username: username,
      },
    });

    return ticket;
  } catch (error) {
    console.error("Erro ao buscar ticket:", error);
    throw error;
  }
}

// Listar todos os tickets
export async function listarTickets(filtros?: {
  status_ticket?: StatusTicket;
  status_ldap?: StatusLDAP;
  status_sgu?: StatusSGU;
  dias_sem_logar_min?: number;
  fechado?: boolean;
}): Promise<any[]> {
  try {
    const where: any = {};

    if (filtros?.status_ticket) {
      where.status_ticket = filtros.status_ticket;
    }

    if (filtros?.status_ldap) {
      where.status_ldap = filtros.status_ldap;
    }

    if (filtros?.status_sgu) {
      where.status_sgu = filtros.status_sgu;
    }

    if (filtros?.dias_sem_logar_min) {
      where.dias_sem_logar = {
        gte: filtros.dias_sem_logar_min,
      };
    }

    if (filtros?.fechado !== undefined) {
      where.fechado = filtros.fechado;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: {
        data_criacao: "desc",
      },
    });

    return tickets;
  } catch (error) {
    console.error("Erro ao listar tickets:", error);
    throw error;
  }
}

// Atualizar status do ticket
export async function atualizarStatusTicket(
  username: string,
  status_ticket: StatusTicket,
  observacoes?: string,
  fechado?: boolean
): Promise<any> {
  try {
    const updateData: any = {
      status_ticket: status_ticket,
      data_atualizacao: new Date(),
    };

    if (observacoes !== undefined) {
      updateData.observacoes = observacoes;
    }

    if (fechado !== undefined) {
      updateData.fechado = fechado;
    }

    const ticket = await prisma.ticket.update({
      where: {
        username: username,
      },
      data: updateData,
    });

    return ticket;
  } catch (error) {
    console.error("Erro ao atualizar status do ticket:", error);
    throw error;
  }
}

// Deletar ticket
export async function deletarTicket(username: string): Promise<boolean> {
  try {
    await prisma.ticket.delete({
      where: {
        username: username,
      },
    });

    return true;
  } catch (error) {
    console.error("Erro ao deletar ticket:", error);
    return false;
  }
}

// Estatísticas dos tickets
export async function obterEstatisticasTickets(): Promise<any> {
  try {
    const total = await prisma.ticket.count();

    const porStatusTicket = await prisma.ticket.groupBy({
      by: ["status_ticket"],
      _count: {
        status_ticket: true,
      },
    });

    const porStatusLDAP = await prisma.ticket.groupBy({
      by: ["status_ldap"],
      _count: {
        status_ldap: true,
      },
    });

    const porStatusSGU = await prisma.ticket.groupBy({
      by: ["status_sgu"],
      _count: {
        status_sgu: true,
      },
    });

    return {
      total,
      porStatusTicket,
      porStatusLDAP,
      porStatusSGU,
    };
  } catch (error) {
    console.error("Erro ao obter estatísticas dos tickets:", error);
    throw error;
  }
}
