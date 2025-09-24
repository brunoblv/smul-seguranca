import { NextRequest, NextResponse } from "next/server";
import ldap from "ldapjs";
import { buscarDepartamentoSgu, initSguDatabase } from "@/lib/sgu-database";

// Configurações do LDAP - ajustadas para o ambiente específico
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

interface SearchRequest {
  searchType: "username" | "email" | "displayName";
  searchValue: string;
  ouFilter?: string;
}

interface UserResult {
  exists: boolean;
  username?: string;
  email?: string;
  displayName?: string;
  department?: string;
  userAccountControl?: string;
  lockoutTime?: string;
  lastLogonTimestamp?: string;
  lastLogon?: string;
  error?: string;
}

// Função para escapar valores de filtro LDAP
function escapeFilterValue(value: string): string {
  // Escapar apenas os caracteres essenciais para LDAP
  return value
    .replace(/\\/g, "\\5c")
    .replace(/\(/g, "\\28")
    .replace(/\)/g, "\\29")
    .replace(/\*/g, "\\2a")
    .replace(/\//g, "\\2f")
    .replace(/\0/g, "\\00");
}

function createLDAPFilter(searchType: string, searchValue: string): string {
  const escapedValue = escapeFilterValue(searchValue);

  switch (searchType) {
    case "username":
      // Para Active Directory, usar sAMAccountName
      return `(sAMAccountName=${escapedValue})`;
    case "email":
      return `(mail=${escapedValue})`;
    case "displayName":
      // Para busca por nome, tentar busca exata primeiro
      // Se não encontrar, o frontend pode tentar variações
      return `(cn=${escapedValue})`;
    default:
      return `(sAMAccountName=${escapedValue})`;
  }
}

// Função para criar filtros alternativos para busca parcial
function createPartialSearchFilters(searchValue: string): string[] {
  const escapedValue = escapeFilterValue(searchValue);
  const filters = [];

  // Tentar diferentes combinações sem wildcards
  filters.push(`(cn=${escapedValue})`);
  filters.push(`(displayName=${escapedValue})`);
  filters.push(`(givenName=${escapedValue})`);
  filters.push(`(sn=${escapedValue})`);

  // Se o valor contém espaço, tentar diferentes combinações
  if (searchValue.includes(" ")) {
    const parts = searchValue
      .split(" ")
      .filter((part) => part.trim().length > 0);

    if (parts.length >= 2) {
      const firstName = escapeFilterValue(parts[0]);

      // Buscar por primeiro nome e qualquer parte do nome como sobrenome
      for (let i = 1; i < parts.length; i++) {
        const namePart = escapeFilterValue(parts[i]);
        filters.push(`(&(givenName=${firstName})(sn=${namePart}))`);
      }

      // Buscar por primeiro nome e último sobrenome
      const lastName = escapeFilterValue(parts[parts.length - 1]);
      filters.push(`(&(givenName=${firstName})(sn=${lastName}))`);

      // Buscar por primeiro nome e segundo nome
      if (parts.length >= 2) {
        const secondName = escapeFilterValue(parts[1]);
        filters.push(`(&(givenName=${firstName})(sn=${secondName}))`);
      }

      // Buscar por primeiro nome em givenName e qualquer parte do nome em displayName
      for (let i = 1; i < parts.length; i++) {
        const namePart = escapeFilterValue(parts[i]);
        filters.push(`(&(givenName=${firstName})(displayName=*${namePart}*))`);
      }
    }
  }

  return filters;
}

async function searchLDAP(
  filter: string,
  ouFilter?: string
): Promise<UserResult> {
  return new Promise((resolve, reject) => {
    console.log(
      `[LDAP Search] Iniciando busca com filtro: ${filter}${
        ouFilter ? `, OU: ${ouFilter}` : ""
      }`
    );

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

    // Para Active Directory, usar o formato usuario@dominio.com
    const bindDN = LDAP_CONFIG.bindDN.includes("\\")
      ? LDAP_CONFIG.bindDN
      : LDAP_CONFIG.bindDN.includes("@")
      ? LDAP_CONFIG.bindDN
      : `${LDAP_CONFIG.bindDN}@${LDAP_CONFIG.domain.replace("@", "")}`;

    // Timeout para evitar travamento
    const timeout = setTimeout(() => {
      console.error("Timeout na busca LDAP");
      client.unbind();
      reject(new Error("Timeout na busca LDAP"));
    }, 15000);

    client.bind(bindDN, LDAP_CONFIG.bindPassword, (err) => {
      if (err) {
        console.error("Erro na autenticação LDAP:", err);
        clearTimeout(timeout);
        client.unbind();
        reject(err);
        return;
      }

      // Determinar a base DN baseada no filtro de OU
      let searchBase = LDAP_CONFIG.baseDN;
      if (ouFilter) {
        // Se um filtro de OU foi especificado, buscar apenas nessa OU
        searchBase = `OU=${ouFilter},${LDAP_CONFIG.baseDN}`;
      }

      const searchOptions: any = {
        scope: "sub" as any,
        filter: filter,
        // Atributos específicos do Active Directory
        attributes: [
          "sAMAccountName",
          "mail",
          "displayName",
          "cn",
          "department",
          "ou",
          "title",
          "telephoneNumber",
          "mobile",
          "company",
          "userAccountControl",
          "lockoutTime",
          "lastLogonTimestamp",
          "lastLogon",
        ],
      };

      client.search(searchBase, searchOptions, (err, res) => {
        if (err) {
          console.error("Erro na busca LDAP:", err);
          clearTimeout(timeout);
          client.unbind();
          reject(err);
          return;
        }

        let found = false;
        let userData: any = {};

        res.on("searchEntry", (entry) => {
          found = true;
          userData = entry.object;
        });

        res.on("error", (err) => {
          console.error("Erro na busca LDAP:", err);
          clearTimeout(timeout);
          client.unbind();
          reject(err);
        });

        res.on("end", async () => {
          clearTimeout(timeout);
          client.unbind();

          if (found) {
            const username = userData.sAMAccountName || userData.uid;
            let departmentSgu: string | undefined;

            // Buscar departamento SGU se o usuário foi encontrado
            if (username) {
              try {
                await initSguDatabase();
                const sguDept = await buscarDepartamentoSgu(username);
                departmentSgu = sguDept || undefined;
              } catch (error) {
                console.error("Erro ao buscar departamento SGU:", error);
                // Continua sem o departamento SGU
              }
            }

            resolve({
              exists: true,
              username,
              email: userData.mail,
              displayName: userData.displayName || userData.cn,
              department: userData.department || userData.ou,
              userAccountControl: userData.userAccountControl,
              lockoutTime: userData.lockoutTime,
              lastLogonTimestamp: userData.lastLogonTimestamp,
              lastLogon: userData.lastLogon,
              departmentSgu,
            });
          } else {
            resolve({
              exists: false,
            });
          }
        });
      });
    });
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username é obrigatório" },
        { status: 400 }
      );
    }

    // Cria o filtro LDAP para username
    const filter = createLDAPFilter("username", username);

    // Realiza a busca
    const result = await searchLDAP(filter);

    return NextResponse.json({
      success: true,
      data: result.exists ? [result] : [],
    });
  } catch (error) {
    console.error("Erro na API de busca LDAP:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor ao conectar com LDAP",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { searchType, searchValue, ouFilter } = body;

    console.log(
      `[LDAP Search] Tipo: ${searchType}, Valor: ${searchValue}${
        ouFilter ? `, OU: ${ouFilter}` : ""
      }`
    );

    if (!searchType || !searchValue) {
      return NextResponse.json(
        { error: "Tipo de busca e valor são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação básica dos tipos de busca
    if (!["username", "email", "displayName"].includes(searchType)) {
      return NextResponse.json(
        { error: "Tipo de busca inválido" },
        { status: 400 }
      );
    }

    if (searchValue.trim().length === 0) {
      return NextResponse.json(
        { error: "Valor de busca não pode estar vazio" },
        { status: 400 }
      );
    }

    // Para busca por nome, tentar múltiplos filtros e coletar todos os resultados
    if (searchType === "displayName") {
      const filters = createPartialSearchFilters(searchValue);
      console.log(
        `[LDAP Search] Tentando ${filters.length} filtros para busca por nome`
      );

      const allResults: UserResult[] = [];
      const foundUsernames = new Set<string>();

      for (const filter of filters) {
        console.log(`[LDAP Search] Tentando filtro: ${filter}`);
        try {
          const result = await searchLDAP(filter, ouFilter);
          if (
            result.exists &&
            result.username &&
            !foundUsernames.has(result.username)
          ) {
            console.log(
              `[LDAP Search] Usuário encontrado com filtro: ${filter}`
            );
            allResults.push(result);
            foundUsernames.add(result.username);
          }
        } catch (error) {
          console.log(`[LDAP Search] Erro com filtro ${filter}:`, error);
          // Continua para o próximo filtro
        }
      }

      // Se encontrou usuários, retornar array de resultados
      if (allResults.length > 0) {
        return NextResponse.json({
          multiple: true,
          results: allResults,
          count: allResults.length,
        });
      }

      // Se nenhum filtro funcionou, retornar não encontrado
      return NextResponse.json({
        exists: false,
      });
    } else {
      // Para username e email, usar filtro único
      const filter = createLDAPFilter(searchType, searchValue);
      console.log(`[LDAP Search] Filtro gerado: ${filter}`);

      // Realiza a busca
      const result = await searchLDAP(filter, ouFilter);
      console.log(`[LDAP Search] Resultado:`, result);

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Erro na API de busca LDAP:", error);

    return NextResponse.json(
      {
        exists: false,
        error: `Erro interno do servidor: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      },
      { status: 500 }
    );
  }
}
