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

interface SearchRequest {
  searchType: "username" | "email" | "displayName";
  searchValue: string;
}

interface UserResult {
  exists: boolean;
  username?: string;
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
    case "displayName":
      // Busca por nome completo usando displayName ou cn
      return `(|(displayName=*${escapedValue}*)(cn=*${escapedValue}*))`;
    default:
      return `(sAMAccountName=${escapedValue})`;
  }
}

async function searchLDAP(filter: string): Promise<UserResult> {
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
              exists: true,
              username: userData.sAMAccountName || userData.uid,
              email: userData.mail,
              displayName: userData.displayName || userData.cn,
              department: userData.department || userData.ou,
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

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { searchType, searchValue } = body;

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

    // Cria o filtro LDAP
    const filter = createLDAPFilter(searchType, searchValue);

    // Realiza a busca
    const result = await searchLDAP(filter);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro na API de busca LDAP:", error);

    return NextResponse.json(
      {
        exists: false,
        error: "Erro interno do servidor ao conectar com LDAP",
      },
      { status: 500 }
    );
  }
}
