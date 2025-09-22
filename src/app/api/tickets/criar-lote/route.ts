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
    const { usuarios, tipo, observacoes, forcarCriacao } = await request.json();

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
    const ticketsExistentes = [];

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

        // Lógica diferente para exonerados vs transferidos
        if (ticketExistente) {
          if (tipo === "exonerados") {
            // Para exonerados, só cria se forçar ou se não forçar
            if (!forcarCriacao) {
              ticketsExistentes.push({
                usuario: usernameLDAP,
                nome: usuario.cpNome,
                ticketId: ticketExistente.id,
                acao: ticketExistente.acao,
                dataCriacao: ticketExistente.data_criacao,
              });
              continue;
            }
          } else {
            // Para transferidos, sempre permite criar (mudança de unidade)
            // Continua para criar o ticket
          }
        }

        // Determinar ação baseada no tipo
        let acao;
        if (tipo === "exonerados") {
          acao = "EXCLUIR";
        } else {
          // Para transferidos (mudança de unidade)
          acao = "RETIRAR_ACESSOS";
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
            acao: acao,
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

    // Se há tickets existentes e não foi forçado, retornar erro especial
    if (ticketsExistentes.length > 0 && !forcarCriacao) {
      return NextResponse.json({
        success: false,
        message: "Existem tickets abertos para alguns usuários",
        ticketsExistentes: ticketsExistentes,
        ticketsCriados: ticketsCriados.length,
        totalUsuarios: usuarios.length,
        erros: erros.length > 0 ? erros : undefined,
      });
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
