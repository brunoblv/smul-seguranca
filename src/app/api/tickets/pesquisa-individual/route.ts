import { NextRequest, NextResponse } from "next/server";
import { buscarUsuarioLDAP } from "@/lib/ldap-ticket";
import { buscarUsuarioSGU } from "@/lib/sgu-ticket";
import { criarOuAtualizarTicket, TicketData } from "@/lib/ticket-database";
import { StatusLDAP, StatusSGU, StatusTicket } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username é obrigatório" },
        { status: 400 }
      );
    }

    console.log(`=== PESQUISA INDIVIDUAL: ${username} ===`);

    // 1. Buscar informações no LDAP
    console.log("1. Buscando informações LDAP...");
    const ldapInfo = await buscarUsuarioLDAP(username);

    // 2. Buscar informações no SGU
    console.log("2. Buscando informações SGU...");
    const sguInfo = await buscarUsuarioSGU(username);

    // 3. Preparar dados do ticket
    const ticketData: TicketData = {
      username: username,
      nome: ldapInfo.nome || "Não encontrado",
      email: ldapInfo.email,
      departamento: ldapInfo.empresa, // Usar empresa em vez de departamento
      empresa: ldapInfo.empresa,
      status_ldap: ldapInfo.status_ldap,
      ultimo_login: ldapInfo.ultimo_login,
      dias_sem_logar: ldapInfo.dias_sem_logar,
      status_sgu: sguInfo.status_sgu,
      setor_sgu: sguInfo.setor_sgu,
      status_ticket: StatusTicket.PENDENTE,
      servidor_origem: ldapInfo.servidor_origem,
      ou_origem: ldapInfo.ou_origem,
    };

    // 4. Criar ou atualizar ticket no banco
    console.log("3. Criando/atualizando ticket...");
    const ticket = await criarOuAtualizarTicket(ticketData);

    console.log("4. Ticket criado/atualizado com sucesso");

    return NextResponse.json({
      success: true,
      message: "Pesquisa realizada e ticket criado/atualizado com sucesso",
      data: {
        ticket,
        ldap_info: ldapInfo,
        sgu_info: sguInfo,
      },
    });
  } catch (error) {
    console.error("Erro na pesquisa individual:", error);
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
