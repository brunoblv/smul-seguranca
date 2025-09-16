import { NextRequest, NextResponse } from "next/server";
import {
  salvarUsuarioExonerado,
  obterEstatisticasExonerados,
} from "@/lib/exonerados-database";
import { StatusExonerado } from "@prisma/client";

interface UsuarioSGU {
  cpUsuarioRede: string;
  cpNome: string;
  cpNomeSocial: string;
  cpnomecargo2: string;
  cpVinculo: string;
  cpRF: string;
  cpnomesetor2: string;
  cpUltimaCarga: string;
  cpOBS: string;
}

interface UsuarioLDAP {
  username: string;
  exists: boolean;
  email?: string;
  displayName?: string;
  department?: string;
  lastLogon?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== PROCESSAMENTO DE USUÁRIOS EXONERADOS/TRANSFERIDOS ===");

    // 1. Buscar usuários do SGU
    console.log("1. Buscando usuários do SGU...");
    const sguResponse = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
      }/api/sgu/exonerados`
    );
    const sguData = await sguResponse.json();

    if (!sguData.success) {
      throw new Error(`Erro ao buscar usuários do SGU: ${sguData.message}`);
    }

    const usuariosSGU: UsuarioSGU[] = sguData.data;
    console.log(`   Encontrados ${usuariosSGU.length} usuários no SGU`);

    if (usuariosSGU.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum usuário exonerado/transferido encontrado no SGU",
        data: [],
        summary: {
          sgu: 0,
          ldap: 0,
          salvos: 0,
        },
      });
    }

    // 2. Verificar usuários no LDAP
    console.log("2. Verificando usuários no LDAP...");
    const usernames = usuariosSGU.map((u) => u.cpUsuarioRede);

    const ldapResponse = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
      }/api/ldap/check-users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames }),
      }
    );

    const ldapData = await ldapResponse.json();

    if (!ldapData.success) {
      throw new Error(
        `Erro ao verificar usuários no LDAP: ${ldapData.message}`
      );
    }

    const usuariosLDAP: UsuarioLDAP[] = ldapData.data;
    console.log(`   Verificados ${usuariosLDAP.length} usuários no LDAP`);

    // 3. Processar e salvar usuários
    console.log("3. Processando e salvando usuários...");
    const usuariosProcessados = [];
    let salvos = 0;

    for (const usuarioSGU of usuariosSGU) {
      const usuarioLDAP = usuariosLDAP.find(
        (u) => u.username === usuarioSGU.cpUsuarioRede
      );

      // Determinar status baseado na existência no LDAP
      let status: StatusExonerado;
      if (usuarioLDAP?.exists) {
        status = StatusExonerado.ATIVO_LDAP;
      } else {
        // Determinar status baseado no vínculo ou observações
        const vinculo = usuarioSGU.cpVinculo?.toLowerCase();
        const obs = usuarioSGU.cpOBS?.toLowerCase() || "";

        if (vinculo === "e" || obs.includes("exonerado")) {
          status = StatusExonerado.EXONERADO;
        } else if (vinculo === "t" || obs.includes("transferido")) {
          status = StatusExonerado.TRANSFERIDO;
        } else if (vinculo === "l" || obs.includes("lip")) {
          status = StatusExonerado.LIP;
        } else if (vinculo === "a" || obs.includes("afastado")) {
          status = StatusExonerado.AFASTADO_PARA_OUTRO_ORGAO;
        } else if (vinculo === "m" || obs.includes("licença médica")) {
          status = StatusExonerado.LICENCA_MEDICA;
        } else {
          status = StatusExonerado.PENDENTE;
        }
      }

      const usuarioData = {
        username: usuarioSGU.cpUsuarioRede,
        nome: usuarioSGU.cpNomeSocial || usuarioSGU.cpNome,
        email: usuarioLDAP?.email,
        departamento_ldap: usuarioLDAP?.department,
        departamento_sgu: usuarioSGU.cpnomesetor2,
        cargo: usuarioSGU.cpnomecargo2,
        vinculo: usuarioSGU.cpVinculo,
        rf: usuarioSGU.cpRF,
        existe_ldap: usuarioLDAP?.exists || false,
        status,
        observacoes: usuarioSGU.cpOBS,
      };

      try {
        await salvarUsuarioExonerado(usuarioData);
        salvos++;
        console.log(
          `   ✓ Salvo: ${usuarioData.username} (${usuarioData.nome})`
        );
      } catch (error) {
        console.error(`   ✗ Erro ao salvar ${usuarioData.username}:`, error);
      }

      usuariosProcessados.push(usuarioData);
    }

    // 4. Obter estatísticas finais
    const estatisticas = await obterEstatisticasExonerados();

    console.log(`=== PROCESSAMENTO CONCLUÍDO ===`);
    console.log(`Usuários do SGU: ${usuariosSGU.length}`);
    console.log(`Usuários verificados no LDAP: ${usuariosLDAP.length}`);
    console.log(`Usuários salvos: ${salvos}`);
    console.log(`Total no banco: ${estatisticas.total}`);

    return NextResponse.json({
      success: true,
      message: `Processamento concluído: ${salvos} usuários salvos`,
      data: usuariosProcessados,
      summary: {
        sgu: usuariosSGU.length,
        ldap: usuariosLDAP.length,
        salvos,
        total: estatisticas.total,
        ativosLDAP: estatisticas.ativosLDAP,
        inativosLDAP: estatisticas.inativosLDAP,
      },
      estatisticas,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ Erro no processamento de usuários exonerados/transferidos:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Erro no processamento de usuários exonerados/transferidos",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
