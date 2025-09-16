import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioSessao } from "@/lib/auth-session";

export async function GET(request: NextRequest) {
  try {
    const usuario = await obterUsuarioSessao(request);

    if (!usuario) {
      return NextResponse.json(
        {
          success: false,
          message: "Não autenticado",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: usuario,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
