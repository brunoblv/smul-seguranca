import { NextRequest, NextResponse } from "next/server";
import {
  buscarUsuariosExonerados,
  obterEstatisticasExonerados,
} from "@/lib/exonerados-database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const ativoLDAP = searchParams.get("ativoLDAP");

    let usuarios;

    if (status) {
      // Buscar por status específico
      const { buscarUsuariosPorStatus } = await import(
        "@/lib/exonerados-database"
      );
      usuarios = await buscarUsuariosPorStatus(status as any);
    } else if (ativoLDAP === "true") {
      // Buscar apenas ativos no LDAP
      const { buscarUsuariosAtivosLDAP } = await import(
        "@/lib/exonerados-database"
      );
      usuarios = await buscarUsuariosAtivosLDAP();
    } else if (ativoLDAP === "false") {
      // Buscar apenas inativos no LDAP
      const { buscarUsuariosInativosLDAP } = await import(
        "@/lib/exonerados-database"
      );
      usuarios = await buscarUsuariosInativosLDAP();
    } else {
      // Buscar todos
      usuarios = await buscarUsuariosExonerados();
    }

    const estatisticas = await obterEstatisticasExonerados();

    return NextResponse.json({
      success: true,
      message: `Encontrados ${usuarios.length} usuários exonerados/transferidos`,
      data: usuarios,
      count: usuarios.length,
      estatisticas,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro ao listar usuários exonerados/transferidos:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao listar usuários exonerados/transferidos",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
