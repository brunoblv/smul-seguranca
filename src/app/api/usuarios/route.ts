import { NextRequest, NextResponse } from "next/server";
import {
  listarUsuarios,
  criarUsuario,
  buscarUsuarioPorId,
  atualizarUsuario,
  deletarUsuario,
} from "@/lib/auth-database";
import { verificarPermissaoMiddleware } from "@/lib/auth-session";
import { Permissao } from "@prisma/client";

// GET - Listar usuários
export async function GET(request: NextRequest) {
  try {
    const { usuario, autorizado } = await verificarPermissaoMiddleware(
      request,
      Permissao.VISUALIZAR_USUARIOS
    );

    if (!usuario || !autorizado) {
      return NextResponse.json(
        {
          success: false,
          message: "Sem permissão para visualizar usuários",
        },
        { status: 403 }
      );
    }

    const usuarios = await listarUsuarios();

    return NextResponse.json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// POST - Criar usuário
export async function POST(request: NextRequest) {
  try {
    const { usuario, autorizado } = await verificarPermissaoMiddleware(
      request,
      Permissao.CRIAR_USUARIOS
    );

    if (!usuario || !autorizado) {
      return NextResponse.json(
        {
          success: false,
          message: "Sem permissão para criar usuários",
        },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { username, nome, email, admin, permissoes } = data;

    if (!username || !nome) {
      return NextResponse.json(
        {
          success: false,
          message: "Username e nome são obrigatórios",
        },
        { status: 400 }
      );
    }

    const novoUsuario = await criarUsuario({
      username,
      nome,
      email,
      admin: admin || false,
      permissoes: permissoes || [],
    });

    return NextResponse.json({
      success: true,
      message: "Usuário criado com sucesso",
      data: novoUsuario,
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
