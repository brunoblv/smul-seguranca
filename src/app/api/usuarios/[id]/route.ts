import { NextRequest, NextResponse } from "next/server";
import {
  buscarUsuarioPorId,
  atualizarUsuario,
  deletarUsuario,
} from "@/lib/auth-database";
import { verificarPermissaoMiddleware } from "@/lib/auth-session";
import { Permissao } from "@prisma/client";

// GET - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID inválido",
        },
        { status: 400 }
      );
    }

    const usuarioEncontrado = await buscarUsuarioPorId(id);
    if (!usuarioEncontrado) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: usuarioEncontrado,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { usuario, autorizado } = await verificarPermissaoMiddleware(
      request,
      Permissao.EDITAR_USUARIOS
    );

    if (!usuario || !autorizado) {
      return NextResponse.json(
        {
          success: false,
          message: "Sem permissão para editar usuários",
        },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID inválido",
        },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { nome, email, ativo, admin, permissoes } = data;

    const usuarioAtualizado = await atualizarUsuario(id, {
      nome,
      email,
      ativo,
      admin,
      permissoes,
    });

    return NextResponse.json({
      success: true,
      message: "Usuário atualizado com sucesso",
      data: usuarioAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// DELETE - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { usuario, autorizado } = await verificarPermissaoMiddleware(
      request,
      Permissao.ADMINISTRAR_SISTEMA
    );

    if (!usuario || !autorizado) {
      return NextResponse.json(
        {
          success: false,
          message: "Sem permissão para deletar usuários",
        },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID inválido",
        },
        { status: 400 }
      );
    }

    // Não permitir deletar a si mesmo
    if (usuario.id === id) {
      return NextResponse.json(
        {
          success: false,
          message: "Não é possível deletar seu próprio usuário",
        },
        { status: 400 }
      );
    }

    const sucesso = await deletarUsuario(id);
    if (!sucesso) {
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao deletar usuário",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Usuário deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
