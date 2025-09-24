import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Buscar unidade por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID inválido",
        },
        { status: 400 }
      );
    }

    const unidade = await prisma.unidadeOrganizacional.findUnique({
      where: { id },
    });

    if (!unidade) {
      return NextResponse.json(
        {
          success: false,
          error: "Unidade não encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      unidade,
    });
  } catch (error) {
    console.error("Erro ao buscar unidade organizacional:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar unidade organizacional
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { codigo, nome, descricao, ativo, ordem } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID inválido",
        },
        { status: 400 }
      );
    }

    // Verificar se a unidade existe
    const existing = await prisma.unidadeOrganizacional.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Unidade não encontrada",
        },
        { status: 404 }
      );
    }

    // Se o código está sendo alterado, verificar se já existe
    if (codigo && codigo !== existing.codigo) {
      const codigoExists = await prisma.unidadeOrganizacional.findUnique({
        where: { codigo },
      });

      if (codigoExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Código já existe",
          },
          { status: 400 }
        );
      }
    }

    const unidade = await prisma.unidadeOrganizacional.update({
      where: { id },
      data: {
        ...(codigo && { codigo }),
        ...(nome && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(ativo !== undefined && { ativo }),
        ...(ordem !== undefined && { ordem }),
      },
    });

    return NextResponse.json({
      success: true,
      unidade,
    });
  } catch (error) {
    console.error("Erro ao atualizar unidade organizacional:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// DELETE - Excluir unidade organizacional
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID inválido",
        },
        { status: 400 }
      );
    }

    // Verificar se a unidade existe
    const existing = await prisma.unidadeOrganizacional.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Unidade não encontrada",
        },
        { status: 404 }
      );
    }

    await prisma.unidadeOrganizacional.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Unidade excluída com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir unidade organizacional:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
