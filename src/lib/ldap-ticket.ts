import ldap from "ldapjs";
import { StatusLDAP } from "@prisma/client";

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

export interface LDAPUserInfo {
  exists: boolean;
  nome?: string;
  email?: string;
  departamento?: string;
  empresa?: string;
  status_ldap: StatusLDAP;
  ultimo_login?: string;
  dias_sem_logar?: number;
  servidor_origem?: string;
  ou_origem?: string;
}

// Função para calcular dias sem logar
function calcularDiasSemLogar(lastLogon?: string): number {
  if (!lastLogon || lastLogon === "Nunca") {
    return 999; // Valor alto para usuários que nunca fizeram login
  }

  try {
    const lastLoginDate = new Date(lastLogon);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastLoginDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    console.error("Erro ao calcular dias sem logar:", error);
    return 999;
  }
}

// Função para converter timestamp do Active Directory
function converterTimestampAD(timestamp: string): string {
  try {
    const ts = parseInt(timestamp);
    if (ts > 0) {
      const date = new Date(ts / 10000 - 11644473600000);
      return date.toISOString().split("T")[0];
    }
    return "Nunca";
  } catch (error) {
    console.error("Erro ao converter timestamp:", error);
    return "Nunca";
  }
}

// Função para determinar status LDAP baseado nos atributos do usuário
function determinarStatusLDAP(userData: any): StatusLDAP {
  if (!userData) {
    return StatusLDAP.NAO_ENCONTRADO;
  }

  // Verificar se a conta está desabilitada
  if (userData.userAccountControl) {
    const uac = parseInt(userData.userAccountControl);
    // Bit 2 = ACCOUNTDISABLE
    if (uac & 2) {
      return StatusLDAP.DESATIVO;
    }
  }

  // Verificar se a conta está bloqueada
  if (userData.lockoutTime && userData.lockoutTime !== "0") {
    return StatusLDAP.BLOQUEADO;
  }

  // Se chegou até aqui, a conta está ativa
  return StatusLDAP.ATIVO;
}

// Buscar informações de um usuário no LDAP
export async function buscarUsuarioLDAP(
  username: string
): Promise<LDAPUserInfo> {
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
        exists: false,
        status_ldap: StatusLDAP.NAO_ENCONTRADO,
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
          exists: false,
          status_ldap: StatusLDAP.NAO_ENCONTRADO,
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
          "cn",
          "department",
          "company",
          "userAccountControl",
          "lockoutTime",
          "lastLogon",
          "lastLogonTimestamp",
          "distinguishedName",
        ],
      };

      client.search(LDAP_CONFIG.baseDN, searchOptions, (err, res) => {
        if (err) {
          console.error(`Erro na busca LDAP para ${username}:`, err);
          client.unbind();
          resolve({
            exists: false,
            status_ldap: StatusLDAP.NAO_ENCONTRADO,
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
            exists: false,
            status_ldap: StatusLDAP.NAO_ENCONTRADO,
          });
        });

        res.on("end", () => {
          client.unbind();

          if (found) {
            // Determinar status LDAP
            const status_ldap = determinarStatusLDAP(userData);

            // Converter timestamp do último login
            let ultimo_login = "Nunca";
            if (userData.lastLogonTimestamp) {
              ultimo_login = converterTimestampAD(userData.lastLogonTimestamp);
            } else if (userData.lastLogon) {
              ultimo_login = converterTimestampAD(userData.lastLogon);
            }

            // Calcular dias sem logar
            const dias_sem_logar = calcularDiasSemLogar(ultimo_login);

            // Extrair servidor e OU de origem do distinguishedName
            let servidor_origem = "Desconhecido";
            let ou_origem = "Desconhecido";

            if (userData.distinguishedName) {
              const dn = userData.distinguishedName;
              // Extrair servidor (primeiro DC)
              const serverMatch = dn.match(/DC=([^,]+)/);
              if (serverMatch) {
                servidor_origem = serverMatch[1];
              }

              // Extrair OU
              const ouMatch = dn.match(/OU=([^,]+)/);
              if (ouMatch) {
                ou_origem = ouMatch[1];
              }
            }

            resolve({
              exists: true,
              nome:
                userData.displayName || userData.cn || "Nome não encontrado",
              email: userData.mail || null,
              departamento: userData.department || null,
              empresa: userData.company || null,
              status_ldap: status_ldap,
              ultimo_login: ultimo_login,
              dias_sem_logar: dias_sem_logar,
              servidor_origem: servidor_origem,
              ou_origem: ou_origem,
            });
          } else {
            resolve({
              exists: false,
              status_ldap: StatusLDAP.NAO_ENCONTRADO,
            });
          }
        });
      });
    });
  });
}

// Buscar informações de múltiplos usuários no LDAP
export async function buscarUsuariosLDAP(
  usernames: string[]
): Promise<Record<string, LDAPUserInfo>> {
  const resultados: Record<string, LDAPUserInfo> = {};

  // Inicializar todos os usuários como não encontrados
  usernames.forEach((username) => {
    resultados[username] = {
      exists: false,
      status_ldap: StatusLDAP.NAO_ENCONTRADO,
    };
  });

  // Buscar cada usuário individualmente
  for (const username of usernames) {
    try {
      const resultado = await buscarUsuarioLDAP(username);
      resultados[username] = resultado;
    } catch (error) {
      console.error(`Erro ao buscar usuário ${username}:`, error);
      resultados[username] = {
        exists: false,
        status_ldap: StatusLDAP.NAO_ENCONTRADO,
      };
    }
  }

  return resultados;
}
