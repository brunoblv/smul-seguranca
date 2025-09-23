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

    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Lista de IDs de usuários é obrigatória",
        },
        { status: 400 }
      );
    }

    console.log(`Iniciando exclusão em lote de ${userIds.length} usuários`);

    // Conectar ao banco de assinatura
    const pool = await initAssinaturaDatabase();

    // Verificar quais usuários existem
    const placeholders = userIds.map(() => "?").join(",");
    const [usersCheck] = await pool.execute(
      `SELECT id, login, nome FROM usuarios WHERE id IN (${placeholders})`,
      userIds
    );

    const existingUsers = usersCheck as any[];
    const existingIds = existingUsers.map((user) => user.id);
    const notFoundIds = userIds.filter((id) => !existingIds.includes(id));

    if (existingUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhum usuário encontrado para exclusão",
        },
        { status: 404 }
      );
    }

    console.log(`Encontrados ${existingUsers.length} usuários para exclusão`);

    // Excluir os usuários
    const [result] = await pool.execute(
      `DELETE FROM usuarios WHERE id IN (${placeholders})`,
      existingIds
    );

    console.log(`${existingUsers.length} usuários excluídos com sucesso`);

    return NextResponse.json({
      success: true,
      message: `${existingUsers.length} usuários excluídos com sucesso`,
      data: {
        excluidos: existingUsers.map((user) => ({
          id: user.id,
          login: user.login,
          nome: user.nome,
        })),
        nao_encontrados: notFoundIds,
        total_excluidos: existingUsers.length,
        total_nao_encontrados: notFoundIds.length,
        excluido_em: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao excluir usuários em lote:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        message: "Falha ao excluir usuários em lote",
      },
      { status: 500 }
    );
  }
}
