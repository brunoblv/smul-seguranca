import mysql from "mysql2/promise";

// Configuração do banco de assinatura - usando variáveis de ambiente
const assinaturaConfig = {
  host: process.env.ASSINATURA_DB_HOST || "10.75.32.170",
  port: parseInt(process.env.ASSINATURA_DB_PORT || "3306"),
  database: process.env.ASSINATURA_DB_NAME || "assinatura",
  user: process.env.ASSINATURA_DB_USER || "usuario",
  password: process.env.ASSINATURA_DB_PASSWORD || "Hta123P@@",
  connectionLimit: 10,
  connectTimeout: 30000,
  idleTimeout: 30000,
};

// Pool de conexões
let pool: mysql.Pool | null = null;

// Inicializar pool de conexões
export async function initAssinaturaDatabase() {
  try {
    if (!pool) {
      pool = mysql.createPool(assinaturaConfig);
      // Testar conexão
      const connection = await pool.getConnection();
      connection.release();
    }
    return pool;
  } catch (error) {
    console.error("Erro ao conectar ao banco de assinatura:", error);
    throw error;
  }
}

// Interface para usuário do banco de assinatura
export interface UsuarioAssinatura {
  id: string;
  login: string;
  nome: string;
  email?: string;
  aniversario?: string;
  cargo?: string;
  telefone?: string;
  setorId?: string;
  permissao?: string;
  andar?: string;
  ramal?: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
  unidade_nome?: string;
}

// Buscar todos os usuários do banco de assinatura
export async function buscarUsuariosAssinatura(): Promise<UsuarioAssinatura[]> {
  try {
    const pool = await initAssinaturaDatabase();

    // Buscar todos os usuários com nome da unidade
    const [rows] = await pool.execute(`
      SELECT 
        u.id,
        u.login,
        u.nome,
        u.email,
        u.aniversario,
        u.cargo,
        u.telefone,
        u.setorId,
        u.permissao,
        u.andar,
        u.ramal,
        u.criadoEm,
        u.atualizadoEm,
        s.nome as unidade_nome
      FROM usuarios u
      LEFT JOIN setores s ON u.setorId = s.id
      ORDER BY u.nome
    `);

    return rows as UsuarioAssinatura[];
  } catch (error) {
    console.error("Erro ao buscar usuários do banco de assinatura:", error);
    throw error;
  }
}

// Buscar usuário específico por login
export async function buscarUsuarioAssinaturaPorLogin(
  login: string
): Promise<UsuarioAssinatura | null> {
  try {
    const pool = await initAssinaturaDatabase();

    const [rows] = await pool.execute(
      "SELECT * FROM usuarios WHERE login = ?",
      [login]
    );

    const usuarios = rows as UsuarioAssinatura[];
    return usuarios.length > 0 ? usuarios[0] : null;
  } catch (error) {
    console.error(
      `Erro ao buscar usuário ${login} no banco de assinatura:`,
      error
    );
    throw error;
  }
}

// Fechar pool de conexões
export async function fecharAssinaturaDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
