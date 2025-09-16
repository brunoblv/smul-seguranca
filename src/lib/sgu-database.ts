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

// Buscar departamento do usuário no SGU
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

    const [rows] = await pool.execute(
      `SELECT cpnomesetor2 
       FROM tblUsuarios 
       WHERE cpUsuarioRede = ?`,
      [username]
    );

    const result = rows as Array<{ cpnomesetor2: string }>;
    console.log(`Resultado da busca SGU para ${username}:`, result);

    if (result.length > 0) {
      const departamento = result[0].cpnomesetor2 || null;
      console.log(
        `Departamento SGU encontrado para ${username}: ${departamento}`
      );
      return departamento;
    }

    console.log(`Nenhum departamento SGU encontrado para ${username}`);
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

    const [rows] = await pool.execute(
      `SELECT cpUsuarioRede, cpnomesetor2 
       FROM tblUsuarios 
       WHERE cpUsuarioRede IN (${placeholders})`,
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
      cpnomesetor2: string;
    }>;
    result.forEach((row) => {
      departamentos[row.cpUsuarioRede] = row.cpnomesetor2 || null;
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
