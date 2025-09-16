import { StatusSGU } from "@prisma/client";
import { initSguDatabase } from "./sgu-database";

export interface SGUUserInfo {
  status_sgu: StatusSGU;
  setor_sgu?: string;
}

// Buscar informações de um usuário no SGU
export async function buscarUsuarioSGU(username: string): Promise<SGUUserInfo> {
  try {
    console.log(`Buscando informações SGU para usuário: ${username}`);

    // Inicializar conexão SGU
    await initSguDatabase();

    // Buscar departamento no SGU
    const { buscarDepartamentoSgu } = await import("./sgu-database");
    const setor_sgu = await buscarDepartamentoSgu(username);

    if (setor_sgu) {
      console.log(`Usuário ${username} encontrado no SGU: ${setor_sgu}`);
      return {
        status_sgu: StatusSGU.ENCONTRADO,
        setor_sgu: setor_sgu,
      };
    } else {
      console.log(`Usuário ${username} não encontrado no SGU`);
      return {
        status_sgu: StatusSGU.NAO_ENCONTRADO,
      };
    }
  } catch (error) {
    console.error(`Erro ao buscar usuário ${username} no SGU:`, error);
    return {
      status_sgu: StatusSGU.NAO_ENCONTRADO,
    };
  }
}

// Buscar informações de múltiplos usuários no SGU
export async function buscarUsuariosSGU(
  usernames: string[]
): Promise<Record<string, SGUUserInfo>> {
  const resultados: Record<string, SGUUserInfo> = {};

  try {
    console.log(`Buscando informações SGU para ${usernames.length} usuários`);

    // Inicializar conexão SGU
    await initSguDatabase();

    // Buscar departamentos em lote no SGU
    const { buscarDepartamentosSgu } = await import("./sgu-database");
    const departamentos = await buscarDepartamentosSgu(usernames);

    // Processar resultados
    usernames.forEach((username) => {
      const setor_sgu = departamentos[username];

      if (setor_sgu) {
        console.log(`Usuário ${username} encontrado no SGU: ${setor_sgu}`);
        resultados[username] = {
          status_sgu: StatusSGU.ENCONTRADO,
          setor_sgu: setor_sgu,
        };
      } else {
        console.log(`Usuário ${username} não encontrado no SGU`);
        resultados[username] = {
          status_sgu: StatusSGU.NAO_ENCONTRADO,
        };
      }
    });

    return resultados;
  } catch (error) {
    console.error("Erro ao buscar usuários no SGU:", error);

    // Em caso de erro, retornar todos como não encontrados
    usernames.forEach((username) => {
      resultados[username] = {
        status_sgu: StatusSGU.NAO_ENCONTRADO,
      };
    });

    return resultados;
  }
}
