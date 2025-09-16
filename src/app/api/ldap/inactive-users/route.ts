import { NextRequest, NextResponse } from "next/server";
import * as ldap from "ldapjs";
import { buscarDepartamentosSgu, initSguDatabase } from "@/lib/sgu-database";

// Lista de servidores LDAP
const LDAP_SERVERS = [
  "ldap://10.10.53.10",
  "ldap://10.10.53.11",
  "ldap://10.10.53.12",
  "ldap://10.10.64.213",
  "ldap://10.10.65.242",
  "ldap://10.10.65.90",
  "ldap://10.10.65.91",
  "ldap://10.10.66.85",
  "ldap://10.10.68.42",
  "ldap://10.10.68.43",
  "ldap://10.10.68.44",
  "ldap://10.10.68.45",
  "ldap://10.10.68.46",
  "ldap://10.10.68.47",
  "ldap://10.10.68.48",
  "ldap://10.10.68.49",
];

interface InactiveUser {
  username: string;
  displayName: string;
  email?: string;
  department?: string;
  departmentSgu?: string;
  lastLogon?: string;
  daysInactive: number;
  ou: string;
  server: string;
}

interface InactiveUsersRequest {
  inactiveDays: 30 | 45 | 60;
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

// Função para converter timestamp do Active Directory para data
function convertADTimestamp(timestamp: string): Date | null {
  try {
    // Active Directory timestamp é em 100-nanosecond intervals desde 1601-01-01
    // Fórmula correta: (AD_timestamp / 10000000) - 11644473600
    const adTimestamp = parseInt(timestamp);
    if (isNaN(adTimestamp) || adTimestamp === 0) {
      return null;
    }

    // Converter para segundos Unix
    const unixTimestamp = adTimestamp / 10000000 - 11644473600;

    // Verificar se o timestamp é válido (não muito antigo ou futuro)
    if (
      unixTimestamp < 0 ||
      unixTimestamp > Date.now() / 1000 + 86400 * 365 * 10
    ) {
      console.log(`Timestamp inválido: ${timestamp} -> ${unixTimestamp}`);
      return null;
    }

    return new Date(unixTimestamp * 1000);
  } catch (error) {
    console.error(
      "Erro ao converter timestamp AD:",
      error,
      "timestamp:",
      timestamp
    );
    return null;
  }
}

// Função para calcular dias inativos
function calculateDaysInactive(lastLogon?: string): number {
  if (!lastLogon) return 999; // Nunca fez login

  try {
    const lastLogonDate = new Date(lastLogon);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastLogonDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

async function searchUsersInNetwork(
  serverUrl: string
): Promise<InactiveUser[]> {
  return new Promise((resolve, reject) => {
    console.log(
      `Conectando ao servidor ${serverUrl} para busca em toda a rede SP`
    );

    const client = ldap.createClient({
      url: serverUrl,
      timeout: 30000,
      connectTimeout: 10000,
    });

    // Para Active Directory, usar o formato usuario@dominio.com
    const bindDN = process.env.LDAP_USER?.includes("\\")
      ? process.env.LDAP_USER
      : process.env.LDAP_USER?.includes("@")
      ? process.env.LDAP_USER
      : `${process.env.LDAP_USER}@${process.env.LDAP_DOMAIN?.replace("@", "")}`;

    client.bind(bindDN, process.env.LDAP_PASS || "", (err) => {
      if (err) {
        console.error(`Erro ao conectar com ${serverUrl}:`, err.message);
        client.destroy();
        resolve([]);
        return;
      }

      console.log(`Conectado com sucesso ao servidor ${serverUrl}`);

      const users: InactiveUser[] = [];
      const searchOptions: any = {
        scope: "sub" as any,
        filter: `(&(objectClass=user)(objectCategory=person)(lastLogonTimestamp=*)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))`, // Só usuários reais ativos com lastLogonTimestamp
        attributes: [
          "sAMAccountName",
          "displayName",
          "mail",
          "department",
          "lastLogonTimestamp",
          "lastLogon",
          "pwdLastSet",
          "whenCreated",
        ],
        sizeLimit: 2000, // Aumentado para 2000 usuários por servidor
      };

      console.log(
        `Executando busca no servidor ${serverUrl} em toda a rede SP com filtro: ${searchOptions.filter}`
      );

      // Usar a base DN da rede SP em vez de OU específica
      const baseDN = process.env.LDAP_BASE || "DC=rede,DC=sp";
      client.search(baseDN, searchOptions, (err, res) => {
        if (err) {
          console.error(
            `Erro na busca de usuários em ${serverUrl}:`,
            err.message
          );
          client.destroy();
          resolve([]);
          return;
        }

        res.on("searchEntry", (entry) => {
          // Extrair dados diretamente do objeto entry (como no PHP)
          const username = Array.isArray(entry.object.sAMAccountName)
            ? entry.object.sAMAccountName[0]
            : entry.object.sAMAccountName || "";
          const displayName = Array.isArray(entry.object.displayName)
            ? entry.object.displayName[0]
            : entry.object.displayName || "";
          const email = Array.isArray(entry.object.mail)
            ? entry.object.mail[0]
            : entry.object.mail || "";
          const department = Array.isArray(entry.object.department)
            ? entry.object.department[0]
            : entry.object.department || "";

          // Tenta diferentes atributos de último login
          let lastLogon: string | undefined;
          const lastLogonTimestamp = entry.object.lastLogonTimestamp;
          const lastLogonAttr = entry.object.lastLogon;

          if (lastLogonTimestamp) {
            const date = convertADTimestamp(
              Array.isArray(lastLogonTimestamp)
                ? lastLogonTimestamp[0]
                : lastLogonTimestamp
            );
            lastLogon = date ? date.toISOString() : undefined;
          } else if (lastLogonAttr) {
            const date = convertADTimestamp(
              Array.isArray(lastLogonAttr) ? lastLogonAttr[0] : lastLogonAttr
            );
            lastLogon = date ? date.toISOString() : undefined;
          }

          const daysInactive = calculateDaysInactive(lastLogon);

          // Log detalhado para debug
          if (username) {
            console.log(
              `Usuário ${username}: lastLogon=${lastLogon}, daysInactive=${daysInactive}`
            );
          }

          users.push({
            username,
            displayName: displayName || username,
            email: email || undefined,
            department: department || undefined,
            lastLogon,
            daysInactive,
            ou: "REDE_SP", // Indica que é de toda a rede SP
            server: serverUrl,
          });
        });

        res.on("error", (err) => {
          if (err.message.includes("Size Limit Exceeded")) {
            console.log(
              `Servidor ${serverUrl}: Rede SP tem muitos usuários (limite excedido). Retornando usuários encontrados até o limite.`
            );
            // Não resolve com array vazio, deixa os usuários já encontrados
          } else {
            console.error(
              `Erro na busca de usuários em ${serverUrl}:`,
              err.message
            );
          }
          client.destroy();
          resolve(users); // Retorna os usuários já encontrados
        });

        res.on("end", () => {
          console.log(
            `Servidor ${serverUrl}: encontrados ${users.length} usuários na OU ${ou}`
          );
          client.destroy();
          resolve(users);
        });
      });
    });
  });
}

async function findLatestLoginForUser(
  username: string
): Promise<{ lastLogon?: string; server: string }> {
  const searchPromises = LDAP_SERVERS.map(async (serverUrl) => {
    return new Promise<{ lastLogon?: string; server: string }>((resolve) => {
      const client = ldap.createClient({
        url: serverUrl,
        timeout: 10000,
        connectTimeout: 10000,
      });

      // Para Active Directory, usar o formato usuario@dominio.com
      const bindDN = process.env.LDAP_USER?.includes("\\")
        ? process.env.LDAP_USER
        : process.env.LDAP_USER?.includes("@")
        ? process.env.LDAP_USER
        : `${process.env.LDAP_USER}@${process.env.LDAP_DOMAIN?.replace(
            "@",
            ""
          )}`;
      const baseDN = process.env.LDAP_BASE || "DC=rede,DC=sp";
      const escapedUsername = escapeFilterValue(username);

      client.bind(bindDN, process.env.LDAP_PASS || "", (err) => {
        if (err) {
          client.destroy();
          resolve({ server: serverUrl });
          return;
        }

        const searchOptions: any = {
          scope: "sub" as any,
          filter: `(sAMAccountName=${escapedUsername})`,
          attributes: ["lastLogonTimestamp", "lastLogon"],
        };

        client.search(baseDN, searchOptions, (err, res) => {
          if (err) {
            client.destroy();
            resolve({ server: serverUrl });
            return;
          }

          res.on("searchEntry", (entry) => {
            const lastLogonTimestamp = entry.attributes.find(
              (attr) => (attr as any).type === "lastLogonTimestamp"
            )?.vals?.[0];
            const lastLogonAttr = entry.attributes.find(
              (attr) => (attr as any).type === "lastLogon"
            )?.vals?.[0];

            let lastLogon: string | undefined;
            if (lastLogonTimestamp) {
              const date = convertADTimestamp(lastLogonTimestamp);
              lastLogon = date ? date.toISOString() : undefined;
            } else if (lastLogonAttr) {
              const date = convertADTimestamp(lastLogonAttr);
              lastLogon = date ? date.toISOString() : undefined;
            }

            client.destroy();
            resolve({ lastLogon, server: serverUrl });
          });

          res.on("error", () => {
            client.destroy();
            resolve({ server: serverUrl });
          });

          res.on("end", () => {
            client.destroy();
            resolve({ server: serverUrl });
          });
        });
      });
    });
  });

  const results = await Promise.all(searchPromises);

  // Encontra o login mais recente entre todos os servidores
  let latestLogin: { lastLogon?: string; server: string } = {
    server: LDAP_SERVERS[0],
  };

  results.forEach((result) => {
    if (
      result.lastLogon &&
      (!latestLogin.lastLogon || result.lastLogon > latestLogin.lastLogon)
    ) {
      latestLogin = result;
    }
  });

  return latestLogin;
}

export async function POST(request: NextRequest) {
  try {
    const body: InactiveUsersRequest = await request.json();
    const { inactiveDays } = body;

    if (!inactiveDays) {
      return NextResponse.json(
        { error: "Dias inativos é obrigatório" },
        { status: 400 }
      );
    }

    if (![30, 45, 60].includes(inactiveDays)) {
      return NextResponse.json(
        { error: "Dias inativos deve ser 30, 45 ou 60" },
        { status: 400 }
      );
    }

    console.log(
      `Buscando usuários inativos há mais de ${inactiveDays} dias em toda a rede SP`
    );
    console.log(`Servidores LDAP a serem consultados: ${LDAP_SERVERS.length}`);

    // Busca usuários em todos os servidores da rede SP
    const searchPromises = LDAP_SERVERS.map((server) =>
      searchUsersInNetwork(server)
    );
    const results = await Promise.all(searchPromises);

    console.log(
      `Resultados por servidor:`,
      results.map((serverUsers, index) => ({
        server: LDAP_SERVERS[index],
        userCount: serverUsers.length,
      }))
    );

    // Combina TODOS os resultados de todos os servidores (como no PHP)
    const allUsers: InactiveUser[] = [];
    results.forEach((serverUsers) => {
      allUsers.push(...serverUsers);
    });

    console.log(
      `Total de usuários encontrados em todos os servidores: ${allUsers.length}`
    );

    // Agrupa usuários por username e encontra o último login mais recente (como no PHP)
    const userMap = new Map<string, InactiveUser>();

    // Log para debug - verificar primeiros usuários
    console.log(`\n=== DEBUG: PRIMEIROS 5 USUÁRIOS ENCONTRADOS ===`);
    allUsers.slice(0, 5).forEach((user, index) => {
      console.log(
        `Usuário ${index + 1}: username="${user.username}", lastLogon="${
          user.lastLogon
        }", server="${user.server}"`
      );
    });

    for (const user of allUsers) {
      // Pular usuários sem username válido
      if (!user.username || user.username.trim() === "") {
        console.log(`Pulando usuário sem username válido:`, user);
        continue;
      }

      const existingUser = userMap.get(user.username);

      if (!existingUser) {
        // Primeira ocorrência do usuário
        userMap.set(user.username, user);
      } else if (user.lastLogon && existingUser.lastLogon) {
        // Compara timestamps para encontrar o mais recente
        const userTimestamp = new Date(user.lastLogon).getTime();
        const existingTimestamp = new Date(existingUser.lastLogon).getTime();

        if (userTimestamp > existingTimestamp) {
          // Este login é mais recente
          userMap.set(user.username, user);
        }
      } else if (user.lastLogon && !existingUser.lastLogon) {
        // Este usuário tem login, o existente não
        userMap.set(user.username, user);
      }
    }

    // Como usamos filtro lastLogonTimestamp=*, todos os usuários devem ter login
    // Não precisamos buscar usuários sem login

    const finalUsers = Array.from(userMap.values());

    // Log detalhado dos usuários antes do filtro
    console.log(`\n=== ANÁLISE DE USUÁRIOS ANTES DO FILTRO ===`);
    console.log(`Total de usuários únicos: ${finalUsers.length}`);
    console.log(`Filtro de inatividade: >= ${inactiveDays} dias`);

    finalUsers.forEach((user, index) => {
      if (index < 10) {
        // Mostra apenas os primeiros 10 para não poluir o log
        console.log(
          `Usuário ${index + 1}: ${user.username} - ${
            user.daysInactive
          } dias inativo (lastLogon: ${user.lastLogon})`
        );
      }
    });

    if (finalUsers.length > 10) {
      console.log(`... e mais ${finalUsers.length - 10} usuários`);
    }

    // Filtra usuários inativos
    const inactiveUsers = finalUsers.filter(
      (user) => user.daysInactive >= inactiveDays
    );

    // Ordena por dias inativos (mais inativos primeiro)
    inactiveUsers.sort((a, b) => b.daysInactive - a.daysInactive);

    // Buscar departamentos do SGU para todos os usuários
    try {
      await initSguDatabase();
      const usernames = inactiveUsers.map((user) => user.username);
      const departamentosSgu = await buscarDepartamentosSgu(usernames);

      // Adicionar departamento SGU aos usuários
      inactiveUsers.forEach((user) => {
        user.departmentSgu = departamentosSgu[user.username] || undefined;
      });

      console.log(
        `Departamentos SGU carregados para ${
          Object.keys(departamentosSgu).length
        } usuários`
      );
    } catch (error) {
      console.error("Erro ao buscar departamentos SGU:", error);
      // Continua sem os departamentos SGU
    }

    const summary = {
      totalUsers: finalUsers.length,
      inactiveUsers: inactiveUsers.length,
      activeUsers: finalUsers.length - inactiveUsers.length,
    };

    console.log(
      `Encontrados ${finalUsers.length} usuários, ${inactiveUsers.length} inativos há mais de ${inactiveDays} dias`
    );

    // Salvar usuários inativos na tabela de controle
    if (inactiveUsers.length > 0) {
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          }/api/usuarios-inativos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuarios: inactiveUsers }),
          }
        );

        if (response.ok) {
          console.log(
            `${inactiveUsers.length} usuários inativos salvos na tabela de controle`
          );
        } else {
          console.error("Erro ao salvar usuários na tabela de controle");
        }
      } catch (error) {
        console.error("Erro ao salvar usuários na tabela:", error);
      }
    }

    return NextResponse.json({
      users: inactiveUsers,
      total: inactiveUsers.length,
      summary,
    });
  } catch (error) {
    console.error("Erro na API de usuários inativos:", error);

    return NextResponse.json(
      {
        error: "Erro interno do servidor ao buscar usuários inativos",
        users: [],
      },
      { status: 500 }
    );
  }
}
