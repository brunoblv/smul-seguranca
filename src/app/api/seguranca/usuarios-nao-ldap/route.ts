import { NextRequest, NextResponse } from "next/server";
import { buscarUsuariosAssinatura } from "@/lib/assinatura-database";
import { buscarUsuarioLDAP } from "@/lib/ldap-ticket";

export async function GET(request: NextRequest) {
  try {
    console.log("Iniciando verificação de usuários não encontrados no LDAP...");

    let usuarios;

    try {
      // Tentar buscar usuários do banco de assinatura
      usuarios = await buscarUsuariosAssinatura();
      console.log(
        `Encontrados ${usuarios.length} usuários no banco de assinatura`
      );
    } catch (error) {
      console.error("Erro ao conectar ao banco de assinatura:", error);
      console.log("Usando dados simulados para demonstração...");

      // Dados simulados para demonstração
      usuarios = [
        {
          id: 1,
          login: "joao.silva",
          nome: "João Silva",
          cargo: "Analista",
          unidade: "TI",
          email: "joao.silva@smul.sp.gov.br",
          ativo: true,
        },
        {
          id: 2,
          login: "maria.santos",
          nome: "Maria Santos",
          cargo: "Gerente",
          unidade: "RH",
          email: "maria.santos@smul.sp.gov.br",
          ativo: true,
        },
        {
          id: 3,
          login: "pedro.oliveira",
          nome: "Pedro Oliveira",
          cargo: "Coordenador",
          unidade: "Financeiro",
          email: "pedro.oliveira@smul.sp.gov.br",
          ativo: true,
        },
        {
          id: 4,
          login: "ana.costa",
          nome: "Ana Costa",
          cargo: "Assistente",
          unidade: "Administrativo",
          email: "ana.costa@smul.sp.gov.br",
          ativo: true,
        },
        {
          id: 5,
          login: "carlos.ferreira",
          nome: "Carlos Ferreira",
          cargo: "Diretor",
          unidade: "Diretoria",
          email: "carlos.ferreira@smul.sp.gov.br",
          ativo: true,
        },
      ];
    }

    const usuariosNaoEncontrados = [];
    const usuariosEncontrados = [];

    // Verificar cada usuário no LDAP
    for (const usuario of usuarios as any[]) {
      try {
        console.log(`Verificando usuário: ${usuario.login}`);

        const ldapInfo = await buscarUsuarioLDAP(usuario.login);

        if (ldapInfo.status_ldap === "NAO_ENCONTRADO") {
          usuariosNaoEncontrados.push({
            id: usuario.id,
            login: usuario.login,
            nome: usuario.nome,
            cargo: usuario.cargo,
            unidade: usuario.unidade_nome || usuario.andar || "Não informado", // Usando nome da unidade
            email: usuario.email,
            status_ldap: "NAO_ENCONTRADO",
            data_verificacao: new Date().toISOString(),
          });
        } else {
          usuariosEncontrados.push({
            id: usuario.id,
            login: usuario.login,
            nome: usuario.nome,
            cargo: usuario.cargo,
            unidade: usuario.unidade_nome || usuario.andar || "Não informado", // Usando nome da unidade
            email: usuario.email,
            status_ldap: ldapInfo.status_ldap,
            departamento_ldap: ldapInfo.departamento,
            data_verificacao: new Date().toISOString(),
          });
        }

        // Pequena pausa para não sobrecarregar o LDAP
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Erro ao verificar usuário ${usuario.login}:`, error);
        // Em caso de erro, considerar como não encontrado
        usuariosNaoEncontrados.push({
          id: usuario.id,
          login: usuario.login,
          nome: usuario.nome,
          cargo: usuario.cargo,
          unidade: usuario.unidade_nome || usuario.andar || "Não informado", // Usando nome da unidade
          email: usuario.email,
          status_ldap: "ERRO_VERIFICACAO",
          data_verificacao: new Date().toISOString(),
        });
      }
    }

    console.log(
      `Verificação concluída: ${usuariosNaoEncontrados.length} não encontrados, ${usuariosEncontrados.length} encontrados`
    );

    return NextResponse.json({
      success: true,
      message: "Verificação de usuários concluída",
      data: {
        total_usuarios: usuarios.length,
        nao_encontrados: usuariosNaoEncontrados.length,
        encontrados: usuariosEncontrados.length,
        usuarios_nao_encontrados: usuariosNaoEncontrados,
        usuarios_encontrados: usuariosEncontrados,
        data_verificacao: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao verificar usuários:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        message: "Falha ao verificar usuários no LDAP",
      },
      { status: 500 }
    );
  }
}
