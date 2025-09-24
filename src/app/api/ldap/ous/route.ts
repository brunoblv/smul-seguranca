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

interface OUResult {
  name: string;
  dn: string;
  description?: string;
}

async function searchOUs(): Promise<OUResult[]> {
  return new Promise((resolve, reject) => {
    console.log("[LDAP OUs] Iniciando busca por OUs...");

    const client = ldap.createClient({
      url: LDAP_CONFIG.url,
      timeout: LDAP_CONFIG.timeout,
      connectTimeout: LDAP_CONFIG.connectTimeout,
      idleTimeout: LDAP_CONFIG.idleTimeout,
    });

    client.on("error", (err) => {
      console.error("Erro na conexão LDAP:", err);
      client.unbind();
      reject(err);
    });

    // Timeout para evitar travamento
    const timeout = setTimeout(() => {
      console.error("Timeout na busca de OUs");
      client.unbind();
      reject(new Error("Timeout na busca de OUs"));
    }, 15000);

    const bindDN = LDAP_CONFIG.bindDN.includes("\\")
      ? LDAP_CONFIG.bindDN
      : LDAP_CONFIG.bindDN.includes("@")
      ? LDAP_CONFIG.bindDN
      : `${LDAP_CONFIG.bindDN}@${LDAP_CONFIG.domain.replace("@", "")}`;

    client.bind(bindDN, LDAP_CONFIG.bindPassword, (err) => {
      if (err) {
        console.error("Erro na autenticação LDAP:", err);
        clearTimeout(timeout);
        client.unbind();
        reject(err);
        return;
      }

      const searchOptions: any = {
        scope: "sub" as any,
        filter: "(objectClass=organizationalUnit)",
        attributes: ["ou", "description", "dn"],
      };

      client.search(LDAP_CONFIG.baseDN, searchOptions, (err, res) => {
        if (err) {
          console.error("Erro na busca de OUs:", err);
          clearTimeout(timeout);
          client.unbind();
          reject(err);
          return;
        }

        const ous: OUResult[] = [];

        res.on("searchEntry", (entry) => {
          const obj = entry.object;
          if (obj.ou && obj.ou.length > 0) {
            ous.push({
              name: obj.ou[0],
              dn: obj.dn,
              description: obj.description ? obj.description[0] : undefined,
            });
          }
        });

        res.on("error", (err) => {
          console.error("Erro na busca de OUs:", err);
          clearTimeout(timeout);
          client.unbind();
          reject(err);
        });

        res.on("end", () => {
          clearTimeout(timeout);
          client.unbind();
          console.log(`[LDAP OUs] Encontradas ${ous.length} OUs`);
          resolve(ous);
        });
      });
    });
  });
}

export async function GET(request: NextRequest) {
  try {
    console.log("[LDAP OUs] Iniciando busca por OUs...");

    const ous = await searchOUs();

    // Remover duplicatas baseadas no DN (que é único) e ordenar
    const uniqueOUs = ous.reduce((acc, current) => {
      const existing = acc.find((ou) => ou.dn === current.dn);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as OUResult[]);

    // Ordenar OUs por nome
    uniqueOUs.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return NextResponse.json({
      success: true,
      ous: uniqueOUs,
      count: uniqueOUs.length,
    });
  } catch (error) {
    console.error("Erro na API de busca de OUs:", error);

    return NextResponse.json(
      {
        success: false,
        error: `Erro interno do servidor: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      },
      { status: 500 }
    );
  }
}
