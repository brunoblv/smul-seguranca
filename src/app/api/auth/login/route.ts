import { NextRequest, NextResponse } from "next/server";
import { autenticarLDAP } from "@/lib/auth-ldap";
import {
  buscarUsuarioPorUsername,
  atualizarUltimoLogin,
  criarUsuario,
} from "@/lib/auth-database";
import { gerarToken } from "@/lib/auth-session";
import { Permissao } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username e senha são obrigatórios",
        },
        { status: 400 }
      );
    }

    console.log(`=== LOGIN: ${username} ===`);

    // 1. Autenticar no LDAP
    console.log("1. Autenticando no LDAP...");
    const ldapResult = await autenticarLDAP(username, password);

    if (!ldapResult.success || !ldapResult.user) {
      console.log("2. Falha na autenticação LDAP");
      return NextResponse.json(
        {
          success: false,
          message: ldapResult.error || "Falha na autenticação",
        },
        { status: 401 }
      );
    }

    console.log("2. Autenticação LDAP bem-sucedida");

    // 2. Verificar se usuário existe no banco
    console.log("3. Verificando usuário no banco...");
    let usuario = await buscarUsuarioPorUsername(username);

    if (!usuario) {
      console.log("4. Usuário não encontrado no banco, criando...");
      // Criar usuário automaticamente com permissões básicas
      usuario = await criarUsuario({
        username: ldapResult.user.username,
        nome: ldapResult.user.nome,
        email: ldapResult.user.email,
        admin: false,
        permissoes: [
          Permissao.VISUALIZAR_TICKETS,
          Permissao.CRIAR_TICKETS,
          Permissao.EDITAR_TICKETS,
        ],
      });
      console.log("5. Usuário criado com permissões básicas");
    } else if (!usuario.ativo) {
      console.log("4. Usuário inativo");
      return NextResponse.json(
        {
          success: false,
          message: "Usuário inativo",
        },
        { status: 403 }
      );
    }

    // 3. Atualizar último login
    console.log("6. Atualizando último login...");
    await atualizarUltimoLogin(username);

    // 4. Gerar token JWT
    console.log("7. Gerando token...");
    const token = gerarToken({
      id: usuario.id,
      username: usuario.username,
      nome: usuario.nome,
      email: usuario.email || undefined,
      admin: usuario.admin,
      permissoes: usuario.permissoes.map((p) => p.permissao),
    });

    console.log("8. Login concluído com sucesso");

    // 5. Retornar resposta com token
    const response = NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        token,
        user: {
          id: usuario.id,
          username: usuario.username,
          nome: usuario.nome,
          email: usuario.email,
          admin: usuario.admin,
          permissoes: usuario.permissoes.map((p) => p.permissao),
        },
      },
    });

    // Definir cookie com o token
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 horas
    });

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
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
