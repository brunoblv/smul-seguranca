import { NextRequest, NextResponse } from "next/server";
import { initSguDatabase } from "@/lib/sgu-database";
import { buscarUsuarioLDAP } from "@/lib/ldap-ticket";
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
  connectTimeout: 30000,
  idleTimeout: 30000,
};

interface UsuarioSMUL {
  rf: string;
  username: string;
  nome: string;
  unidade_sigla: string;
  unidade_nome: string;
  departamento: string;
  cargo: string;
  vinculo: string;
  dias_sem_logar: number;
  ultimo_login?: string;
  status_ldap: string;
  email?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log("=== BUSCA DE TODOS OS USUÁRIOS DO SMUL ===");

    // Conectar ao banco SGU
    console.log("1. Conectando ao banco SGU...");
    await initSguDatabase();

    const pool = mysql.createPool(sguConfig);

    // Buscar todos os usuários do SMUL
    console.log("2. Buscando usuários do SMUL...");

    const [rows] = await pool.execute(`
      SELECT 
        t.cpRF,
        t.cpUsuarioRede,
        t.cpNome,
        t.cpNomeSocial,
        t.cpnomecargo2,
        t.cpVinculo,
        t.cpnomesetor2,
        t.cpUnid,
        u.sigla as unidade_sigla,
        u.nome as unidade_nome
      FROM tblUsuarios t
      LEFT JOIN tblUnidades u ON t.cpUnid = u.uid
      WHERE t.cpUsuarioRede IS NOT NULL
        AND t.cpUsuarioRede != ''
      ORDER BY t.cpNome
    `);

    const usuariosSgu = rows as Array<{
      cpRF: string;
      cpUsuarioRede: string;
      cpNome: string;
      cpNomeSocial: string;
      cpnomecargo2: string;
      cpVinculo: string;
      cpnomesetor2: string;
      cpUnid: string;
      unidade_sigla: string;
      unidade_nome: string;
    }>;

    console.log(`3. Encontrados ${usuariosSgu.length} usuários no SGU`);

    // Buscar informações do LDAP para cada usuário
    console.log("4. Buscando informações do LDAP...");
    const usuariosCompletos: UsuarioSMUL[] = [];

    // Processar em lotes para não sobrecarregar o LDAP
    const batchSize = 20; // Reduzido para evitar timeout
    for (let i = 0; i < usuariosSgu.length; i += batchSize) {
      const batch = usuariosSgu.slice(i, i + batchSize);

      const promises = batch.map(async (usuario) => {
        try {
          // Buscar informações do LDAP
          const ldapInfo = await buscarUsuarioLDAP(usuario.cpUsuarioRede);

          // Calcular dias sem logar
          let diasSemLogar = 999; // Nunca fez login
          let ultimoLogin: string | undefined;

          if (ldapInfo.ultimo_login) {
            const lastLoginDate = new Date(ldapInfo.ultimo_login);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - lastLoginDate.getTime());
            diasSemLogar = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            ultimoLogin = lastLoginDate.toISOString();
          }

          return {
            rf: usuario.cpRF,
            username: usuario.cpUsuarioRede,
            nome: usuario.cpNomeSocial || usuario.cpNome,
            unidade_sigla: usuario.unidade_sigla || "N/A",
            unidade_nome: usuario.unidade_nome || "N/A",
            departamento: usuario.cpnomesetor2 || "N/A",
            cargo: usuario.cpnomecargo2 || "N/A",
            vinculo: usuario.cpVinculo || "N/A",
            dias_sem_logar: diasSemLogar,
            ultimo_login: ultimoLogin,
            status_ldap: ldapInfo.status_ldap || "NAO_ENCONTRADO",
            email: ldapInfo.email,
          };
        } catch (error) {
          console.error(
            `Erro ao buscar LDAP para ${usuario.cpUsuarioRede}:`,
            error
          );
          return {
            rf: usuario.cpRF,
            username: usuario.cpUsuarioRede,
            nome: usuario.cpNomeSocial || usuario.cpNome,
            unidade_sigla: usuario.unidade_sigla || "N/A",
            unidade_nome: usuario.unidade_nome || "N/A",
            departamento: usuario.cpnomesetor2 || "N/A",
            cargo: usuario.cpnomecargo2 || "N/A",
            vinculo: usuario.cpVinculo || "N/A",
            dias_sem_logar: 999,
            ultimo_login: undefined,
            status_ldap: "ERRO",
            email: undefined,
          };
        }
      });

      const batchResults = await Promise.all(promises);
      usuariosCompletos.push(...batchResults);

      console.log(
        `Processados ${Math.min(i + batchSize, usuariosSgu.length)}/${
          usuariosSgu.length
        } usuários`
      );
    }

    await pool.end();

    // Ordenar por dias sem logar (mais inativos primeiro)
    usuariosCompletos.sort((a, b) => b.dias_sem_logar - a.dias_sem_logar);

    console.log(
      `5. Processamento concluído: ${usuariosCompletos.length} usuários`
    );

    return NextResponse.json({
      success: true,
      usuarios: usuariosCompletos,
      total: usuariosCompletos.length,
      resumo: {
        total_usuarios: usuariosCompletos.length,
        usuarios_ativos_ldap: usuariosCompletos.filter(
          (u) => u.status_ldap === "ATIVO"
        ).length,
        usuarios_inativos_ldap: usuariosCompletos.filter(
          (u) => u.status_ldap !== "ATIVO"
        ).length,
        usuarios_sem_login_30_dias: usuariosCompletos.filter(
          (u) => u.dias_sem_logar >= 30
        ).length,
        usuarios_sem_login_60_dias: usuariosCompletos.filter(
          (u) => u.dias_sem_logar >= 60
        ).length,
        usuarios_sem_login_90_dias: usuariosCompletos.filter(
          (u) => u.dias_sem_logar >= 90
        ).length,
      },
    });
  } catch (error) {
    console.error("Erro na API de usuários SMUL:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor ao buscar usuários SMUL",
        usuarios: [],
      },
      { status: 500 }
    );
  }
}
