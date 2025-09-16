import { NextRequest, NextResponse } from "next/server";
import { buscarUsuariosLDAP } from "@/lib/ldap-ticket";
import { buscarUsuariosSGU } from "@/lib/sgu-ticket";
import { criarOuAtualizarTicket, TicketData } from "@/lib/ticket-database";
import {
  StatusLDAP,
  StatusSGU,
  StatusTicket,
  AcaoTicket,
} from "@prisma/client";
import { obterUsuarioSessao } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  try {
    const { usernames } = await request.json();

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json(
        { success: false, message: "Lista de usernames é obrigatória" },
        { status: 400 }
      );
    }

    if (usernames.length > 100) {
      return NextResponse.json(
        { success: false, message: "Máximo de 100 usuários por lote" },
        { status: 400 }
      );
    }

    // Obter usuário da sessão para auditoria
    const usuario = await obterUsuarioSessao(request);
    const criado_por = usuario?.nome || usuario?.username || "SISTEMA";

    console.log(`=== PESQUISA EM LOTE: ${usernames.length} usuários ===`);
    console.log(`Usuário logado: ${criado_por}`);

    // 1. Buscar informações no LDAP para todos os usuários
    console.log("1. Buscando informações LDAP...");
    const ldapResults = await buscarUsuariosLDAP(usernames);

    // 2. Buscar informações no SGU para todos os usuários
    console.log("2. Buscando informações SGU...");
    const sguResults = await buscarUsuariosSGU(usernames);

    // 3. Processar cada usuário e criar/atualizar tickets
    console.log("3. Criando/atualizando tickets...");
    const tickets = [];
    const erros = [];

    for (const username of usernames) {
      try {
        const ldapInfo = ldapResults[username];
        const sguInfo = sguResults[username];

        // Preparar dados do ticket
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
          criado_por: criado_por, // Usar o usuário logado
          alterado_por: criado_por,
          data_abertura: new Date(), // Data/hora da abertura do ticket
          data_alteracao: new Date(),
        };

        // Criar ou atualizar ticket
        const ticket = await criarOuAtualizarTicket(ticketData);
        tickets.push(ticket);
      } catch (error) {
        console.error(`Erro ao processar usuário ${username}:`, error);
        erros.push({
          username,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    console.log(
      `4. Processamento concluído: ${tickets.length} tickets criados/atualizados, ${erros.length} erros`
    );

    return NextResponse.json({
      success: true,
      message: `Pesquisa em lote concluída: ${tickets.length} tickets processados, ${erros.length} erros`,
      data: {
        tickets_criados: tickets.length,
        erros: erros.length,
        tickets: tickets,
        erros: erros,
        resumo: {
          total_processados: usernames.length,
          sucessos: tickets.length,
          falhas: erros.length,
        },
      },
    });
  } catch (error) {
    console.error("Erro na pesquisa em lote:", error);
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
