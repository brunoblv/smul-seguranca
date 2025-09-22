import { NextRequest, NextResponse } from "next/server";
import {
  listarTickets,
  buscarTicket,
  atualizarStatusTicket,
  deletarTicket,
  obterEstatisticasTickets,
} from "@/lib/ticket-database";
import { StatusTicket, AcaoTicket } from "@prisma/client";
import { obterUsuarioSessao } from "@/lib/auth-session";

// GET - Listar tickets com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status_ticket = searchParams.get("status_ticket") as StatusTicket;
    const status_ldap = searchParams.get("status_ldap");
    const status_sgu = searchParams.get("status_sgu");
    const dias_sem_logar_min = searchParams.get("dias_sem_logar_min");
    const fechado = searchParams.get("fechado");
    const acao = searchParams.get("acao") as AcaoTicket;
    const username = searchParams.get("username");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    // Se foi especificado um username, buscar ticket específico
    if (username) {
      const ticket = await buscarTicket(username);

      if (!ticket) {
        return NextResponse.json(
          { success: false, message: "Ticket não encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: ticket,
      });
    }

    // Listar tickets com filtros
    const filtros: any = {};

    if (status_ticket) filtros.status_ticket = status_ticket;
    if (status_ldap) filtros.status_ldap = status_ldap;
    if (status_sgu) filtros.status_sgu = status_sgu;
    if (dias_sem_logar_min)
      filtros.dias_sem_logar_min = parseInt(dias_sem_logar_min);
    if (fechado !== null && fechado !== "")
      filtros.fechado = fechado === "true";
    if (
      acao &&
      acao.trim() !== "" &&
      Object.values(AcaoTicket).includes(acao)
    ) {
      filtros.acao = acao;
    }
    if (page) filtros.page = parseInt(page);
    if (limit) filtros.limit = parseInt(limit);

    const resultado = await listarTickets(filtros);

    return NextResponse.json({
      success: true,
      data: resultado.tickets,
      pagination: {
        total: resultado.total,
        totalPages: resultado.totalPages,
        currentPage: resultado.currentPage,
        limit: filtros.limit || 20,
      },
    });
  } catch (error) {
    console.error("Erro ao listar tickets:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar status do ticket ou fechar
export async function PUT(request: NextRequest) {
  try {
    const { username, status_ticket, acao, observacoes, fechado } =
      await request.json();

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          message: "Username é obrigatório",
        },
        { status: 400 }
      );
    }

    // Obter usuário da sessão para auditoria
    const usuario = await obterUsuarioSessao(request);
    const alterado_por = usuario?.nome || usuario?.username || "SISTEMA";

    // Se está fechando o ticket
    if (fechado !== undefined) {
      const ticket = await atualizarStatusTicket(
        username,
        status_ticket || "PENDENTE",
        observacoes,
        fechado,
        alterado_por,
        acao
      );

      return NextResponse.json({
        success: true,
        message: fechado
          ? "Ticket fechado com sucesso"
          : "Ticket reaberto com sucesso",
        data: ticket,
      });
    }

    // Se está atualizando status
    if (!status_ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Status do ticket é obrigatório",
        },
        { status: 400 }
      );
    }

    // Validar status_ticket
    if (!Object.values(StatusTicket).includes(status_ticket)) {
      return NextResponse.json(
        { success: false, message: "Status do ticket inválido" },
        { status: 400 }
      );
    }

    const ticket = await atualizarStatusTicket(
      username,
      status_ticket,
      observacoes,
      undefined,
      alterado_por,
      acao
    );

    return NextResponse.json({
      success: true,
      message: "Status do ticket atualizado com sucesso",
      data: ticket,
    });
  } catch (error) {
    console.error("Erro ao atualizar ticket:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// DELETE - Deletar ticket
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username é obrigatório" },
        { status: 400 }
      );
    }

    const sucesso = await deletarTicket(username);

    if (!sucesso) {
      return NextResponse.json(
        { success: false, message: "Erro ao deletar ticket" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ticket deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar ticket:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
