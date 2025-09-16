import { NextRequest, NextResponse } from "next/server";
import ldap from "ldapjs";

// Configurações do LDAP
const LDAP_CONFIG = {
  url: process.env.LDAP_SERVER || "ldap://10.10.65.242",
  baseDN: process.env.LDAP_BASE || "DC=rede,DC=sp",
  bindDN: process.env.LDAP_USER || "usr_smdu_freenas",
  bindPassword: process.env.LDAP_PASS || "Prodam01",
  domain: process.env.LDAP_DOMAIN || "@rede.sp",
  timeout: 5000,
  connectTimeout: 10000,
  idleTimeout: 10000,
};

interface CheckUsersRequest {
  usernames: string[];
}

interface UserCheckResult {
  username: string;
  exists: boolean;
  email?: string;
  displayName?: string;
  department?: string;
  lastLogon?: string;
  error?: string;
}

async function checkUserInLDAP(username: string): Promise<UserCheckResult> {
  return new Promise((resolve) => {
    const client = ldap.createClient({
      url: LDAP_CONFIG.url,
      timeout: LDAP_CONFIG.timeout,
      connectTimeout: LDAP_CONFIG.connectTimeout,
      idleTimeout: LDAP_CONFIG.idleTimeout,
    });

    client.on("error", (err) => {
      console.error(`Erro na conexão LDAP para ${username}:`, err);
      resolve({
        username,
        exists: false,
        error: "Erro de conexão LDAP",
      });
    });

    // Para Active Directory, usar o formato usuario@dominio.com
    const bindDN = LDAP_CONFIG.bindDN.includes("\\")
      ? LDAP_CONFIG.bindDN
      : LDAP_CONFIG.bindDN.includes("@")
      ? LDAP_CONFIG.bindDN
      : `${LDAP_CONFIG.bindDN}@${LDAP_CONFIG.domain.replace("@", "")}`;

    client.bind(bindDN, LDAP_CONFIG.bindPassword, (err) => {
      if (err) {
        console.error(`Erro na autenticação LDAP para ${username}:`, err);
        client.unbind();
        resolve({
          username,
          exists: false,
          error: "Erro de autenticação LDAP",
        });
        return;
      }

      const searchOptions: any = {
        scope: "sub" as any,
        filter: `(sAMAccountName=${username})`,
        attributes: [
          "sAMAccountName",
          "mail",
          "displayName",
          "department",
          "lastLogon",
          "lastLogonTimestamp",
        ],
      };

      client.search(LDAP_CONFIG.baseDN, searchOptions, (err, res) => {
        if (err) {
          console.error(`Erro na busca LDAP para ${username}:`, err);
          client.unbind();
          resolve({
            username,
            exists: false,
            error: "Erro na busca LDAP",
          });
          return;
        }

        let found = false;
        let userData: any = {};

        res.on("searchEntry", (entry) => {
          found = true;
          userData = entry.object;
        });

        res.on("error", (err) => {
          console.error(`Erro na busca LDAP para ${username}:`, err);
          client.unbind();
          resolve({
            username,
            exists: false,
            error: "Erro na busca LDAP",
          });
        });

        res.on("end", () => {
          client.unbind();

          if (found) {
            // Converter timestamp do Active Directory
            let lastLogon = "Nunca";
            if (userData.lastLogonTimestamp) {
              const timestamp = parseInt(userData.lastLogonTimestamp);
              if (timestamp > 0) {
                const date = new Date(timestamp / 10000 - 11644473600000);
                lastLogon = date.toISOString().split("T")[0];
              }
            }

            resolve({
              username,
              exists: true,
              email: userData.mail,
              displayName: userData.displayName,
              department: userData.department,
              lastLogon,
            });
          } else {
            resolve({
              username,
              exists: false,
            });
          }
        });
      });
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckUsersRequest = await request.json();
    const { usernames } = body;

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json(
        { error: "Lista de usuários é obrigatória" },
        { status: 400 }
      );
    }

    console.log(`=== VERIFICAÇÃO LDAP PARA ${usernames.length} USUÁRIOS ===`);

    // Verificar cada usuário no LDAP
    const results: UserCheckResult[] = [];

    for (const username of usernames) {
      console.log(`Verificando usuário: ${username}`);
      const result = await checkUserInLDAP(username);
      results.push(result);
    }

    const foundCount = results.filter((r) => r.exists).length;
    const notFoundCount = results.filter((r) => !r.exists).length;

    console.log(
      `Resultado: ${foundCount} encontrados, ${notFoundCount} não encontrados`
    );

    return NextResponse.json({
      success: true,
      message: `Verificação concluída: ${foundCount} encontrados, ${notFoundCount} não encontrados`,
      data: results,
      summary: {
        total: usernames.length,
        found: foundCount,
        notFound: notFoundCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro na verificação LDAP:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro na verificação LDAP",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
