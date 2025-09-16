import ldap from "ldapjs";

// Configurações do LDAP para autenticação
const LDAP_CONFIG = {
  url: process.env.LDAP_SERVER || "ldap://10.10.65.242",
  baseDN: process.env.LDAP_BASE || "DC=rede,DC=sp",
  domain: process.env.LDAP_DOMAIN || "@rede.sp",
  timeout: 5000,
  connectTimeout: 10000,
  idleTimeout: 10000,
};

export interface LDAPAuthResult {
  success: boolean;
  user?: {
    username: string;
    nome: string;
    email?: string;
    empresa?: string;
  };
  error?: string;
}

// Autenticar usuário no LDAP
export async function autenticarLDAP(
  username: string,
  password: string
): Promise<LDAPAuthResult> {
  return new Promise((resolve) => {
    const client = ldap.createClient({
      url: LDAP_CONFIG.url,
      timeout: LDAP_CONFIG.timeout,
      connectTimeout: LDAP_CONFIG.connectTimeout,
      idleTimeout: LDAP_CONFIG.idleTimeout,
    });

    client.on("error", (err) => {
      console.error("Erro na conexão LDAP:", err);
      resolve({
        success: false,
        error: "Erro de conexão com o servidor LDAP",
      });
    });

    // Formatar bindDN para Active Directory
    const bindDN = username.includes("@")
      ? username
      : `${username}@${LDAP_CONFIG.domain.replace("@", "")}`;

    // Tentar autenticar
    client.bind(bindDN, password, (err) => {
      if (err) {
        console.error("Erro na autenticação LDAP:", err);
        client.unbind();
        resolve({
          success: false,
          error: "Usuário ou senha inválidos",
        });
        return;
      }

      // Se autenticou, buscar informações do usuário
      const searchOptions: any = {
        scope: "sub" as any,
        filter: `(sAMAccountName=${username})`,
        attributes: ["sAMAccountName", "mail", "displayName", "cn", "company"],
      };

      client.search(LDAP_CONFIG.baseDN, searchOptions, (err, res) => {
        if (err) {
          console.error("Erro na busca LDAP:", err);
          client.unbind();
          resolve({
            success: false,
            error: "Erro ao buscar informações do usuário",
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
          console.error("Erro na busca LDAP:", err);
          client.unbind();
          resolve({
            success: false,
            error: "Erro ao buscar informações do usuário",
          });
        });

        res.on("end", () => {
          client.unbind();

          if (found) {
            resolve({
              success: true,
              user: {
                username: userData.sAMAccountName || username,
                nome:
                  userData.displayName || userData.cn || "Nome não encontrado",
                email: userData.mail || undefined,
                empresa: userData.company || undefined,
              },
            });
          } else {
            resolve({
              success: false,
              error: "Usuário não encontrado no LDAP",
            });
          }
        });
      });
    });
  });
}

// Verificar se usuário existe no LDAP (sem autenticar)
export async function verificarUsuarioLDAP(username: string): Promise<boolean> {
  return new Promise((resolve) => {
    const client = ldap.createClient({
      url: LDAP_CONFIG.url,
      timeout: LDAP_CONFIG.timeout,
      connectTimeout: LDAP_CONFIG.connectTimeout,
      idleTimeout: LDAP_CONFIG.idleTimeout,
    });

    client.on("error", (err) => {
      console.error("Erro na conexão LDAP:", err);
      resolve(false);
    });

    // Usar credenciais de sistema para buscar
    const bindDN = process.env.LDAP_USER?.includes("\\")
      ? process.env.LDAP_USER
      : process.env.LDAP_USER?.includes("@")
      ? process.env.LDAP_USER
      : `${process.env.LDAP_USER}@${LDAP_CONFIG.domain.replace("@", "")}`;

    client.bind(bindDN, process.env.LDAP_PASS || "", (err) => {
      if (err) {
        console.error("Erro na autenticação LDAP:", err);
        client.unbind();
        resolve(false);
        return;
      }

      const searchOptions: any = {
        scope: "sub" as any,
        filter: `(sAMAccountName=${username})`,
        attributes: ["sAMAccountName"],
      };

      client.search(LDAP_CONFIG.baseDN, searchOptions, (err, res) => {
        if (err) {
          console.error("Erro na busca LDAP:", err);
          client.unbind();
          resolve(false);
          return;
        }

        let found = false;

        res.on("searchEntry", () => {
          found = true;
        });

        res.on("error", (err) => {
          console.error("Erro na busca LDAP:", err);
          client.unbind();
          resolve(false);
        });

        res.on("end", () => {
          client.unbind();
          resolve(found);
        });
      });
    });
  });
}
