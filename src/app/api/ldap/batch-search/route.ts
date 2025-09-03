import { NextRequest, NextResponse } from "next/server";
import ldap from "ldapjs";

// Configurações do LDAP - ajustadas para o ambiente específico
const LDAP_CONFIG = {
  url: process.env.LDAP_SERVER || "ldap://10.10.65.242",
  baseDN: process.env.LDAP_BASE || "DC=rede,DC=sp",
  bindDN: process.env.LDAP_USER || "usr_smdu_freenas",
  bindPassword: process.env.LDAP_PASS || "senha",
  domain: process.env.LDAP_DOMAIN || "@rede.sp",
  timeout: 5000,
  connectTimeout: 10000,
  idleTimeout: 10000,
};

interface BatchSearchRequest {
  searchType: "username" | "email";
  users: string[];
}

interface UserResult {
  username: string;
  exists: boolean;
  email?: string;
  displayName?: string;
  department?: string;
  error?: string;
}

// Função para escapar valores de filtro LDAP
function escapeFilterValue(value: string): string {
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
    default:
      return `(sAMAccountName=${escapedValue})`;
  }
}

async function searchSingleUser(
  searchType: string,
  username: string
): Promise<UserResult> {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: LDAP_CONFIG.url,
      timeout: LDAP_CONFIG.timeout,
      connectTimeout: LDAP_CONFIG.connectTimeout,
      idleTimeout: LDAP_CONFIG.idleTimeout,
    });

    client.on("error", (err) => {
      console.error("Erro na conexão LDAP:", err);
      reject(err);
    });

    // Para Active Directory, usar o formato DOMINIO\usuario
    const bindDN = LDAP_CONFIG.bindDN.includes("\\")
      ? LDAP_CONFIG.bindDN
      : `${LDAP_CONFIG.bindDN}${LDAP_CONFIG.domain}`;

    client.bind(bindDN, LDAP_CONFIG.bindPassword, (err) => {
      if (err) {
        console.error("Erro na autenticação LDAP:", err);
        client.unbind();
        reject(err);
        return;
      }

      const filter = createLDAPFilter(searchType, username);
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
        ],
      };

      client.search(LDAP_CONFIG.baseDN, searchOptions, (err, res) => {
        if (err) {
          console.error("Erro na busca LDAP:", err);
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
          client.unbind();
          reject(err);
        });

        res.on("end", () => {
          client.unbind();

          if (found) {
            resolve({
              username,
              exists: true,
              email: userData.mail,
              displayName: userData.displayName || userData.cn,
              department: userData.department || userData.ou,
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

async function searchUsersInBatch(
  searchType: string,
  usernames: string[]
): Promise<UserResult[]> {
  const results: UserResult[] = [];

  // Processa usuários em paralelo, mas com limite para não sobrecarregar o servidor LDAP
  const batchSize = 5; // Processa 5 usuários por vez
  const batches = [];

  for (let i = 0; i < usernames.length; i += batchSize) {
    batches.push(usernames.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const batchPromises = batch.map((username) =>
      searchSingleUser(searchType, username).catch((error) => ({
        username,
        exists: false,
        error: "Erro na busca: " + error.message,
      }))
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Pequena pausa entre lotes para não sobrecarregar o servidor
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchSearchRequest = await request.json();
    const { searchType, users } = body;

    console.log("API recebeu:", { searchType, users, body });

    if (!searchType || !users || !Array.isArray(users)) {
      console.log("Erro de validação - dados inválidos:", {
        searchType,
        users,
      });
      return NextResponse.json(
        { error: "Tipo de busca e lista de usuários são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação dos tipos de busca
    if (!["username", "email"].includes(searchType)) {
      return NextResponse.json(
        { error: "Tipo de busca inválido" },
        { status: 400 }
      );
    }

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Lista de usuários não pode estar vazia" },
        { status: 400 }
      );
    }

    // Limita o número de usuários para evitar sobrecarga
    if (users.length > 200) {
      return NextResponse.json(
        { error: "Máximo de 100 usuários por busca em lote" },
        { status: 400 }
      );
    }

    // Valida se todos os usuários são strings válidas
    const validUsers = users.filter(
      (user) => typeof user === "string" && user.trim().length > 0
    );

    if (validUsers.length === 0) {
      return NextResponse.json(
        { error: "Nenhum usuário válido encontrado na lista" },
        { status: 400 }
      );
    }

    // Remove duplicatas
    const uniqueUsers = [...new Set(validUsers)];

    // Realiza a busca em lote
    const results = await searchUsersInBatch(searchType, uniqueUsers);

    return NextResponse.json({
      results,
      total: results.length,
      found: results.filter((r) => r.exists).length,
      notFound: results.filter((r) => !r.exists && !r.error).length,
      errors: results.filter((r) => r.error).length,
    });
  } catch (error) {
    console.error("Erro na API de busca em lote LDAP:", error);

    return NextResponse.json(
      {
        error: "Erro interno do servidor ao conectar com LDAP",
        results: [],
      },
      { status: 500 }
    );
  }
}
