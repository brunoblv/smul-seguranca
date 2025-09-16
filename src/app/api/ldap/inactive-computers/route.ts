import { NextRequest, NextResponse } from "next/server";
import * as ldap from "ldapjs";
import { salvarComputadorInativo, initDatabase } from "@/lib/database";
import { Status } from "@prisma/client";
import { buscarDepartamentosSgu, initSguDatabase } from "@/lib/sgu-database";

// Inicializar banco na primeira execução
let dbInitialized = false;
async function ensureDatabase() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// Função para converter timestamp do Active Directory
function convertADTimestamp(timestamp: string): string {
  if (!timestamp || timestamp === "0") {
    return new Date().toISOString();
  }

  // Converter timestamp do AD (100-nanosecond intervals since Jan 1, 1601)
  const adTime = BigInt(timestamp);
  const unixTime = Number(adTime / BigInt(10000000) - BigInt(11644473600));
  return new Date(unixTime * 1000).toISOString();
}

// Função para calcular dias inativos
function calcularDiasInativos(lastLogon: string): number {
  const lastLogonDate = new Date(lastLogon);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastLogonDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const body = await request.json();
    const { daysInactive = 30 } = body;

    // Configurações padrão do LDAP (usando as variáveis do .env.local)
    const server = process.env.LDAP_SERVER || "localhost";
    const ou = process.env.LDAP_BASE || "OU=Computadores,DC=smul,DC=gov,DC=br";
    const username = process.env.LDAP_USER || "";
    const password = process.env.LDAP_PASS || "";
    const domain = process.env.LDAP_DOMAIN || "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Credenciais LDAP não configuradas" },
        { status: 400 }
      );
    }

    // Remover o prefixo ldap:// se já estiver presente
    const serverUrl = server.startsWith("ldap://")
      ? server
      : `ldap://${server}`;

    const client = ldap.createClient({
      url: serverUrl,
      timeout: 10000,
      connectTimeout: 10000,
    });

    // Criar bindDN combinando usuário e domínio (igual à API de usuários)
    const bindDN = `${username}${domain}`;

    return new Promise<NextResponse>((resolve) => {
      client.bind(bindDN, password, async (err) => {
        if (err) {
          console.error("Erro ao conectar LDAP:", err);
          console.error("Server:", serverUrl);
          console.error("BindDN:", bindDN);
          client.destroy();
          resolve(
            NextResponse.json(
              { error: `Erro ao conectar no servidor LDAP: ${err.message}` },
              { status: 500 }
            )
          );
          return;
        }

        const searchOptions = {
          scope: "sub" as const,
          filter: "(objectClass=computer)",
          attributes: [
            "name",
            "dNSHostName",
            "ipHostNumber",
            "macAddress",
            "department",
            "managedBy",
            "lastLogonTimestamp",
            "lastLogon",
            "operatingSystem",
            "operatingSystemVersion",
            "distinguishedName",
          ],
        };

        const computadores: any[] = [];

        console.log("Iniciando busca LDAP...");
        console.log("OU:", ou);
        console.log("Filtro:", searchOptions.filter);

        client.search(ou, searchOptions, (err, res) => {
          if (err) {
            console.error("Erro na busca LDAP:", err);
            client.destroy();
            resolve(
              NextResponse.json(
                { error: "Erro ao buscar computadores no LDAP" },
                { status: 500 }
              )
            );
            return;
          }

          res.on("searchEntry", (entry) => {
            try {
              const nomeComputador =
                entry.object.name?.[0] ||
                entry.object.dNSHostName?.[0] ||
                "Desconhecido";
              const ipAddress = entry.object.ipHostNumber?.[0];
              const macAddress = entry.object.macAddress?.[0];
              const departamento = entry.object.department?.[0];
              const managedBy = entry.object.managedBy?.[0];

              // Extrair usuário responsável do managedBy (DN)
              let usuarioResponsavel = "";
              if (managedBy) {
                const match = managedBy.match(/CN=([^,]+)/);
                if (match) {
                  usuarioResponsavel = match[1];
                }
              }

              // Buscar último login
              let lastLogonTimestamp = entry.object.lastLogonTimestamp?.[0];
              let lastLogon = entry.object.lastLogon?.[0];

              // Usar o mais recente entre lastLogonTimestamp e lastLogon
              let ultimoLogin = "";
              if (lastLogonTimestamp && lastLogonTimestamp !== "0") {
                ultimoLogin = convertADTimestamp(lastLogonTimestamp);
              } else if (lastLogon && lastLogon !== "0") {
                ultimoLogin = convertADTimestamp(lastLogon);
              } else {
                ultimoLogin = new Date().toISOString();
              }

              const diasInativos = calcularDiasInativos(ultimoLogin);

              // Só incluir se estiver inativo há mais dias que o especificado
              if (diasInativos >= daysInactive) {
                const sistemaOperacional = entry.object.operatingSystem?.[0];
                const versaoSO = entry.object.operatingSystemVersion?.[0];

                computadores.push({
                  nomeComputador,
                  ipAddress,
                  macAddress,
                  departamento,
                  usuarioResponsavel,
                  lastLogon: ultimoLogin,
                  daysInactive: diasInativos,
                  server,
                  ou,
                  sistemaOperacional,
                  versaoSO,
                });
              }
            } catch (error) {
              console.error("Erro ao processar entrada:", error);
            }
          });

          res.on("error", (err) => {
            console.error("Erro na resposta LDAP:", err);
            resolve(
              NextResponse.json(
                { error: "Erro ao processar resposta do LDAP" },
                { status: 500 }
              )
            );
          });

          res.on("end", async () => {
            try {
              // Buscar departamentos do SGU para usuários responsáveis
              let departamentosSgu: Record<string, string | null> = {};
              try {
                await initSguDatabase();
                const usuariosResponsaveis = computadores
                  .map((c) => c.usuarioResponsavel)
                  .filter(Boolean) as string[];

                if (usuariosResponsaveis.length > 0) {
                  departamentosSgu = await buscarDepartamentosSgu(
                    usuariosResponsaveis
                  );
                  console.log(
                    `Departamentos SGU carregados para ${
                      Object.keys(departamentosSgu).length
                    } usuários responsáveis`
                  );
                }
              } catch (error) {
                console.error("Erro ao buscar departamentos SGU:", error);
                // Continua sem os departamentos SGU
              }

              // Salvar computadores no banco
              const resultados: Array<{
                nomeComputador: string;
                status: string;
                error?: string;
              }> = [];
              for (const computador of computadores) {
                try {
                  // Buscar departamento SGU do usuário responsável
                  const departamentoSgu = computador.usuarioResponsavel
                    ? departamentosSgu[computador.usuarioResponsavel] ||
                      undefined
                    : undefined;

                  await salvarComputadorInativo({
                    nome_computador: computador.nomeComputador,
                    ip_address: computador.ipAddress,
                    mac_address: computador.macAddress,
                    departamento: computador.departamento,
                    departamento_sgu: departamentoSgu,
                    usuario_responsavel: computador.usuarioResponsavel,
                    ultimo_login: computador.lastLogon,
                    dias_inativos: computador.daysInactive,
                    status: Status.PENDENTE,
                    servidor_origem: computador.server,
                    ou_origem: computador.ou,
                    sistema_operacional: computador.sistemaOperacional,
                    versao_so: computador.versaoSO,
                  });

                  resultados.push({
                    nomeComputador: computador.nomeComputador,
                    status: "salvo",
                  });
                } catch (error) {
                  console.error(
                    `Erro ao salvar computador ${computador.nomeComputador}:`,
                    error
                  );
                  resultados.push({
                    nomeComputador: computador.nomeComputador,
                    status: "erro",
                    error:
                      error instanceof Error ? error.message : String(error),
                  });
                }
              }

              client.unbind(() => {
                resolve(
                  NextResponse.json({
                    message: "Busca de computadores inativos concluída",
                    total: computadores.length,
                    sucessos: resultados.filter((r) => r.status === "salvo")
                      .length,
                    erros: resultados.filter((r) => r.status === "erro").length,
                    resultados,
                  })
                );
              });
            } catch (error) {
              console.error("Erro ao salvar computadores:", error);
              client.unbind(() => {
                resolve(
                  NextResponse.json(
                    { error: "Erro ao salvar computadores no banco" },
                    { status: 500 }
                  )
                );
              });
            }
          });
        });
      });
    });
  } catch (error) {
    console.error("Erro geral:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
