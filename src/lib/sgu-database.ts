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
      pool = mysql.createPool(sguConfig);
      // Testar conexão
      const connection = await pool.getConnection();
      connection.release();
    }
    return pool;
  } catch (error) {
    console.error("Erro ao conectar ao banco SGU:", error);
    throw error;
  }
}

export async function buscarDepartamentoSgu(
  username: string
): Promise<string | null> {
  try {
    if (!pool) {
      await initSguDatabase();
    }

    if (!pool) {
      throw new Error("Pool de conexão SGU não inicializado");
    }

    // Buscar usuário e unidade em uma única query
    const [rows] = await pool.execute(
      `SELECT u.sigla, u.nome, t.cpnomesetor2, t.cpUnid
       FROM tblUsuarios t
       LEFT JOIN tblUnidades u ON CAST(t.cpUnid AS CHAR) = CAST(u.uid AS CHAR)
       WHERE t.cpUsuarioRede = ?`,
      [username]
    );

    const result = rows as Array<{
      sigla?: string;
      nome?: string;
      cpnomesetor2: string;
      cpUnid: string;
    }>;

    if (result.length > 0) {
      const row = result[0];

      // Limpeza da sigla removendo caracteres de controle
      let siglaLimpa = null;
      if (row.sigla !== null && row.sigla !== undefined) {
        siglaLimpa = row.sigla
          .toString()
          .trim()
          .replace(/[\r\n\t\0]/g, "");
      }

      const departamento = siglaLimpa && siglaLimpa !== "" ? siglaLimpa : null;

      return departamento;
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar departamento SGU:", error);
    return null;
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
    }
  } catch (error) {
    console.error("Erro ao fechar conexão SGU:", error);
  }
}
