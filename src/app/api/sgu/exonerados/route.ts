import { NextRequest, NextResponse } from "next/server";
import { initSguDatabase } from "@/lib/sgu-database";
import mysql from "mysql2/promise";

// Configuração do banco SGU
const sguConfig = {
  host: process.env.SGU_DB_HOST,
  port: parseInt(process.env.SGU_DB_PORT || "3306"),
  database: process.env.SGU_DB_NAME,
  user: process.env.SGU_DB_USR,
  password: process.env.SGU_DB_PASS,
  connectionLimit: 10,
  acquireTimeout: 30000,
  // Configurações específicas para conexões individuais
  connectTimeout: 30000,
  idleTimeout: 30000,
};

export async function GET(request: NextRequest) {
  try {
    console.log("=== BUSCA DE USUÁRIOS EXONERADOS/TRANSFERIDOS ===");

    // Conectar ao banco SGU
    console.log("1. Conectando ao banco SGU...");
    await initSguDatabase();

    const pool = mysql.createPool(sguConfig);

    // Buscar usuários que NÃO têm cpUltimaCarga = 'x'
    console.log("2. Buscando usuários que NÃO têm cpUltimaCarga = 'x'...");
    const [rows] = await pool.execute(`
      SELECT 
        cpUsuarioRede,
        cpNome,
        cpNomeSocial,
        cpnomecargo2,
        cpVinculo,
        cpRF,
        cpnomesetor2,
        cpUltimaCarga,
        cpOBS
      FROM tblUsuarios 
      WHERE cpUltimaCarga != 'x' OR cpUltimaCarga IS NULL
      ORDER BY cpNome
    `);

    const usuarios = rows as Array<{
      cpUsuarioRede: string;
      cpNome: string;
      cpNomeSocial: string;
      cpnomecargo2: string;
      cpVinculo: string;
      cpRF: string;
      cpnomesetor2: string;
      cpUltimaCarga: string;
      cpOBS: string;
    }>;

    console.log(
      `3. Encontrados ${usuarios.length} usuários ativos (sem 'x' no cpUltimaCarga)`
    );

    await pool.end();

    return NextResponse.json({
      success: true,
      message: `Encontrados ${usuarios.length} usuários ativos (sem 'x' no cpUltimaCarga)`,
      data: usuarios,
      count: usuarios.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro ao buscar usuários exonerados/transferidos:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar usuários exonerados/transferidos",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
