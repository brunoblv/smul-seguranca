import { NextRequest, NextResponse } from "next/server";
import { initAssinaturaDatabase } from "@/lib/assinatura-database";
import { verifyAdminAccess } from "@/lib/auth-session";

export async function DELETE(request: NextRequest) {
  try {
    // Verificar se o usuário é admin
    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Acesso negado. Apenas administradores podem excluir usuários.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "ID do usuário é obrigatório",
        },
        { status: 400 }
      );
    }

    console.log(`Iniciando exclusão do usuário: ${userId}`);

    // Conectar ao banco de assinatura
    const pool = await initAssinaturaDatabase();

    // Verificar se o usuário existe
    const [userCheck] = await pool.execute(
      "SELECT id, login, nome FROM usuarios WHERE id = ?",
      [userId]
    );

    if (!userCheck || (userCheck as any[]).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não encontrado",
        },
        { status: 404 }
      );
    }

    const user = (userCheck as any[])[0];
    console.log(`Usuário encontrado: ${user.nome} (${user.login})`);

    // Excluir o usuário
    const [result] = await pool.execute("DELETE FROM usuarios WHERE id = ?", [
      userId,
    ]);

    console.log(`Usuário ${user.login} excluído com sucesso`);

    return NextResponse.json({
      success: true,
      message: `Usuário ${user.nome} (${user.login}) excluído com sucesso`,
      data: {
        id: userId,
        login: user.login,
        nome: user.nome,
        excluido_em: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        message: "Falha ao excluir usuário",
      },
      { status: 500 }
    );
  }
}
