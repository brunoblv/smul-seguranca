import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface UsuarioSgu {
  cpID: number;
  cpRF: string;
  cpNome: string;
  cpUnid: string;
  cpnomesetor2: string;
  sigla?: string;
  nome_unidade?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { usuarios, tipo, observacoes } = await request.json();

    if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
      return NextResponse.json(
        { success: false, message: "Lista de usuários é obrigatória" },
        { status: 400 }
      );
    }

    if (!tipo || !["exonerados", "transferidos"].includes(tipo)) {
      return NextResponse.json(
        {
          success: false,
          message: "Tipo deve ser 'exonerados' ou 'transferidos'",
        },
        { status: 400 }
      );
    }

    const ticketsCriados = [];
    const erros = [];

    for (const usuario of usuarios) {
      try {
        // Gerar username do LDAP: D + 6 primeiros dígitos do RF
        const usernameLDAP = `D${usuario.cpRF.substring(0, 6)}`;

        // Verificar se já existe um ticket para este usuário
        const ticketExistente = await prisma.ticket.findFirst({
          where: {
            username: usernameLDAP,
            fechado: false,
          },
        });

        if (ticketExistente) {
          erros.push({
            usuario: usernameLDAP,
            erro: "Já existe um ticket aberto para este usuário",
          });
          continue;
        }

        // Criar novo ticket
        const ticket = await prisma.ticket.create({
          data: {
            username: usernameLDAP,
            nome: usuario.cpNome,
            email: "", // Não temos email nas tabelas mensais
            status_ticket: "PENDENTE",
            status_ldap: "NAO_ENCONTRADO", // Assumir que não está mais no LDAP
            status_sgu: "NAO_ENCONTRADO", // Assumir que não está mais no SGU
            empresa: "SMUL",
            setor_sgu:
              usuario.sigla || usuario.nome_unidade || usuario.cpnomesetor2,
            acao: tipo === "exonerados" ? "EXCLUIR" : "TRANSFERIR",
            fechado: false,
            criado_por: "Sistema de Comparação Mensal",
            data_criacao: new Date(),
            observacoes:
              observacoes ||
              `Usuário identificado como ${tipo} na comparação mensal (RF: ${usuario.cpRF})`,
          },
        });

        ticketsCriados.push(ticket);
      } catch (error) {
        console.error(`Erro ao criar ticket para ${usuario.cpRF}:`, error);
        erros.push({
          usuario: usuario.cpRF,
          erro: "Erro interno ao criar ticket",
        });
      }
    }

    return NextResponse.json({
      success: true,
      ticketsCriados: ticketsCriados.length,
      totalUsuarios: usuarios.length,
      erros: erros.length > 0 ? erros : undefined,
      message: `${ticketsCriados.length} tickets criados com sucesso${
        erros.length > 0 ? `, ${erros.length} erros encontrados` : ""
      }`,
    });
  } catch (error) {
    console.error("Erro ao criar tickets em lote:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
