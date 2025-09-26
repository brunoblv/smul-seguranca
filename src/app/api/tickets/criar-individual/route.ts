import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { username, nome, email, departamento, observacoes } =
      await request.json();

    if (!username || !nome) {
      return NextResponse.json(
        { success: false, message: "Username e nome são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se já existe um ticket aberto para este usuário
    const ticketExistente = await prisma.ticket.findFirst({
      where: {
        username: username,
        fechado: false,
      },
    });

    if (ticketExistente) {
      return NextResponse.json({
        success: false,
        message: "Já existe um ticket aberto para este usuário",
        ticketId: ticketExistente.id,
      });
    }

    // Criar novo ticket
    const ticket = await prisma.ticket.create({
      data: {
        username: username,
        nome: nome,
        email: email || "",
        departamento: departamento || "",
        status_ticket: "PENDENTE",
        status_ldap: "NAO_ENCONTRADO", // Será atualizado posteriormente
        status_sgu: "NAO_ENCONTRADO", // Será atualizado posteriormente
        empresa: "SMUL",
        setor_sgu: departamento || "",
        acao: "EXCLUIR", // Ação padrão
        fechado: false,
        criado_por: "Sistema de Usuários SMUL",
        data_criacao: new Date(),
        observacoes: observacoes || `Ticket criado para usuário ${username}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ticket criado com sucesso",
      ticket: {
        id: ticket.id,
        username: ticket.username,
        nome: ticket.nome,
        status: ticket.status_ticket,
        dataCriacao: ticket.data_criacao,
      },
    });
  } catch (error) {
    console.error("Erro ao criar ticket individual:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
