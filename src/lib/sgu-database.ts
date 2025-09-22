import mysql from "mysql2/promise";

// Configuração do banco SGU
const sguConfig = {
  host: process.env.SGU_DB_HOST,
  port: parseInt(process.env.SGU_DB_PORT || "3306"),
  database: process.env.SGU_DB_NAME,
  user: process.env.SGU_DB_USR,
  password: process.env.SGU_DB_PASS,
  connectionLimit: 10,
  acquireTimeout: 30000,
  // Configurações específicas para conexões individuais
  connectTimeout: 30000,
  idleTimeout: 30000,
};

// Pool de conexões
let pool: mysql.Pool | null = null;

// Inicializar pool de conexões
export async function initSguDatabase() {
  try {
    if (!pool) {
      console.log("Tentando conectar ao SGU com configurações:", {
        host: sguConfig.host,
        port: sguConfig.port,
        database: sguConfig.database,
        user: sguConfig.user,
      });
      pool = mysql.createPool(sguConfig);
      // Testar conexão
      const connection = await pool.getConnection();
      connection.release();
      console.log("Conectado ao banco SGU com sucesso");
    }
    return pool;
  } catch (error) {
    console.error("Erro ao conectar ao banco SGU:", error);
    throw error;
  }
}

// Função melhorada com debug detalhado
export async function buscarDepartamentoSgu(
  username: string
): Promise<string | null> {
  try {
    console.log(`Buscando departamento SGU para usuário: ${username}`);

    if (!pool) {
      await initSguDatabase();
    }

    if (!pool) {
      throw new Error("Pool de conexão SGU não inicializado");
    }

    // PRIMEIRO: Verificar se o usuário existe
    const [userRows] = await pool.execute(
      `SELECT cpUsuarioRede, cpUnid, cpnomesetor2 FROM tblUsuarios WHERE cpUsuarioRede = ?`,
      [username]
    );

    console.log(`Usuário encontrado:`, userRows);

    const userRowsArray = userRows as Array<{
      cpUsuarioRede: string;
      cpUnid: string;
      cpnomesetor2: string;
    }>;

    if (userRowsArray.length === 0) {
      console.log(`Usuário ${username} não encontrado na tblUsuarios`);
      return null;
    }

    const userData = userRowsArray[0];
    console.log(
      `cpUnid do usuário: "${
        userData.cpUnid
      }" (tipo: ${typeof userData.cpUnid})`
    );

    // SEGUNDO: Verificar se existe unidade com esse uid
    const [unidadeRows] = await pool.execute(
      `SELECT uid, sigla, nome FROM tblUnidades WHERE uid = ?`,
      [userData.cpUnid]
    );

    console.log(
      `Unidades encontradas para uid ${userData.cpUnid}:`,
      unidadeRows
    );

    // TERCEIRO: Verificar todos os uids disponíveis (para debug)
    const [allUids] = await pool.execute(
      `SELECT DISTINCT uid, sigla, nome FROM tblUnidades LIMIT 10`
    );
    console.log(`Primeiros 10 UIDs disponíveis na tblUnidades:`, allUids);

    // QUARTO: Tentar JOIN com CAST para garantir compatibilidade de tipos
    const [rows] = await pool.execute(
      `SELECT u.sigla, u.nome, t.cpnomesetor2, t.cpUnid,
              LENGTH(u.sigla) as sigla_length,
              HEX(u.sigla) as sigla_hex,
              ASCII(u.sigla) as sigla_ascii
       FROM tblUsuarios t
       LEFT JOIN tblUnidades u ON CAST(t.cpUnid AS CHAR) = CAST(u.uid AS CHAR)
       WHERE t.cpUsuarioRede = ?`,
      [username]
    );

    console.log(`JOIN com CAST executado:`, rows);

    const result = rows as Array<{
      sigla?: string;
      nome?: string;
      cpnomesetor2: string;
      cpUnid: string;
      sigla_length?: number;
      sigla_hex?: string;
      sigla_ascii?: number;
    }>;

    if (result.length > 0) {
      const row = result[0];

      // Debug detalhado do campo sigla
      console.log(`Análise detalhada da sigla:`, {
        sigla_raw: row.sigla,
        sigla_length: row.sigla_length,
        sigla_hex: row.sigla_hex,
        sigla_ascii: row.sigla_ascii,
        sigla_type: typeof row.sigla,
        sigla_is_null: row.sigla === null,
        sigla_is_undefined: row.sigla === undefined,
        sigla_is_empty: row.sigla === "",
      });

      // Limpeza mais cuidadosa
      let siglaLimpa = null;
      if (row.sigla !== null && row.sigla !== undefined) {
        siglaLimpa = row.sigla
          .toString()
          .trim()
          .replace(/[\r\n\t\0]/g, "");
        console.log(
          `Sigla após limpeza: "${siglaLimpa}" (length: ${siglaLimpa.length})`
        );
      }

      const departamento =
        siglaLimpa && siglaLimpa !== "" ? siglaLimpa : row.cpnomesetor2 || null;

      console.log(`Departamento final: ${departamento}`);
      return departamento;
    }

    console.log(`Nenhum resultado encontrado para ${username}`);
    return null;
  } catch (error) {
    console.error("Erro ao buscar departamento SGU:", error);
    return null;
  }
}

// Função adicional para investigar a estrutura das tabelas
export async function investigarEstruturaTabelas(): Promise<void> {
  try {
    if (!pool) {
      await initSguDatabase();
    }

    if (!pool) {
      throw new Error("Pool de conexão SGU não inicializado");
    }

    // Verificar estrutura da tblUsuarios
    const [userStruct] = await pool.execute(`DESCRIBE tblUsuarios`);
    console.log("Estrutura tblUsuarios:", userStruct);

    // Verificar estrutura da tblUnidades
    const [unidStruct] = await pool.execute(`DESCRIBE tblUnidades`);
    console.log("Estrutura tblUnidades:", unidStruct);

    // Verificar alguns exemplos de dados
    const [userSamples] = await pool.execute(
      `SELECT cpUsuarioRede, cpUnid, cpnomesetor2 FROM tblUsuarios LIMIT 5`
    );
    console.log("Amostras tblUsuarios:", userSamples);

    const [unidSamples] = await pool.execute(
      `SELECT uid, sigla, nome FROM tblUnidades LIMIT 5`
    );
    console.log("Amostras tblUnidades:", unidSamples);

    // Verificar se há correspondências
    const [matches] = await pool.execute(`
      SELECT 
        t.cpUsuarioRede,
        t.cpUnid,
        u.uid,
        u.sigla,
        u.nome
      FROM tblUsuarios t
      JOIN tblUnidades u ON t.cpUnid = u.uid
      LIMIT 5
    `);
    console.log("Correspondências encontradas:", matches);
  } catch (error) {
    console.error("Erro ao investigar estrutura:", error);
  }
}

// Buscar múltiplos departamentos de uma vez
export async function buscarDepartamentosSgu(
  usernames: string[]
): Promise<Record<string, string | null>> {
  try {
    if (!pool) {
      await initSguDatabase();
    }

    if (!pool) {
      throw new Error("Pool de conexão SGU não inicializado");
    }

    // Criar placeholders para o IN clause
    const placeholders = usernames.map(() => "?").join(",");

    // Usar diretamente a combinação que sabemos que funciona
    const [rows] = await pool.execute(
      `SELECT t.cpUsuarioRede, u.sigla, u.nome, t.cpUnid
       FROM tblUsuarios t
       LEFT JOIN tblUnidades u ON t.cpUnid = u.uid
       WHERE t.cpUsuarioRede IN (${placeholders})`,
      usernames
    );
    console.log(`JOIN em lote com tblUnidades.uid executado:`, rows);

    // Converter resultado para objeto
    const departamentos: Record<string, string | null> = {};

    // Inicializar todos os usernames como null
    usernames.forEach((username) => {
      departamentos[username] = null;
    });

    // Preencher com os resultados encontrados
    const result = rows as Array<{
      cpUsuarioRede: string;
      sigla: string;
      nome: string;
      cpUnid: string;
    }>;
    result.forEach((row) => {
      // Usar apenas sigla da tblUnidades (removendo espaços e caracteres de controle)
      const siglaLimpa = row.sigla
        ? row.sigla.trim().replace(/[\r\n\t]/g, "")
        : null;
      const departamento = siglaLimpa && siglaLimpa !== "" ? siglaLimpa : null;
      console.log(
        `Departamento SGU para ${row.cpUsuarioRede}: ${departamento} (sigla: ${
          row.sigla
        }, siglaLimpa: ${siglaLimpa || "N/A"}, nome: ${row.nome}, cpUnid: ${
          row.cpUnid
        })`
      );
      departamentos[row.cpUsuarioRede] = departamento;
    });

    return departamentos;
  } catch (error) {
    console.error("Erro ao buscar departamentos SGU:", error);
    // Retornar objeto com todos os usernames como null em caso de erro
    const departamentos: Record<string, string | null> = {};
    usernames.forEach((username) => {
      departamentos[username] = null;
    });
    return departamentos;
  }
}

// Fechar conexão
export async function fecharConexaoSgu() {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      console.log("Conexão SGU fechada");
    }
  } catch (error) {
    console.error("Erro ao fechar conexão SGU:", error);
  }
}
