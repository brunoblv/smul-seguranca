import { PrismaClient, StatusExonerado } from "@prisma/client";

const prisma = new PrismaClient();

export interface UsuarioExoneradoData {
  username: string;
  nome: string;
  email?: string;
  departamento_ldap?: string;
  departamento_sgu?: string;
  cargo?: string;
  vinculo?: string;
  rf?: string;
  existe_ldap: boolean;
  status: StatusExonerado;
  observacoes?: string;
}

// Salvar usuário exonerado/transferido
export async function salvarUsuarioExonerado(data: UsuarioExoneradoData) {
  try {
    const usuario = await prisma.usuarioExoneradoTransferido.upsert({
      where: { username: data.username },
      update: {
        nome: data.nome,
        email: data.email,
        departamento_ldap: data.departamento_ldap,
        departamento_sgu: data.departamento_sgu,
        cargo: data.cargo,
        vinculo: data.vinculo,
        rf: data.rf,
        existe_ldap: data.existe_ldap,
        status: data.status,
        observacoes: data.observacoes,
        data_verificacao: new Date(),
      },
      create: {
        username: data.username,
        nome: data.nome,
        email: data.email,
        departamento_ldap: data.departamento_ldap,
        departamento_sgu: data.departamento_sgu,
        cargo: data.cargo,
        vinculo: data.vinculo,
        rf: data.rf,
        existe_ldap: data.existe_ldap,
        status: data.status,
        observacoes: data.observacoes,
      },
    });

    return usuario;
  } catch (error) {
    console.error("Erro ao salvar usuário exonerado:", error);
    throw error;
  }
}

// Buscar todos os usuários exonerados/transferidos
export async function buscarUsuariosExonerados() {
  try {
    const usuarios = await prisma.usuarioExoneradoTransferido.findMany({
      orderBy: [{ status: "asc" }, { nome: "asc" }],
    });
    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários exonerados:", error);
    throw error;
  }
}

// Buscar usuário exonerado por username
export async function buscarUsuarioExonerado(username: string) {
  try {
    const usuario = await prisma.usuarioExoneradoTransferido.findUnique({
      where: { username },
    });

    return usuario;
  } catch (error) {
    console.error("Erro ao buscar usuário exonerado:", error);
    throw error;
  }
}

// Atualizar status do usuário
export async function atualizarStatusUsuario(
  username: string,
  status: StatusExonerado,
  observacoes?: string
) {
  try {
    const usuario = await prisma.usuarioExoneradoTransferido.update({
      where: { username },
      data: {
        status,
        observacoes,
        data_verificacao: new Date(),
      },
    });

    return usuario;
  } catch (error) {
    console.error("Erro ao atualizar status do usuário:", error);
    throw error;
  }
}

// Buscar usuários por status
export async function buscarUsuariosPorStatus(status: StatusExonerado) {
  try {
    const usuarios = await prisma.usuarioExoneradoTransferido.findMany({
      where: { status },
      orderBy: { nome: "asc" },
    });

    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários por status:", error);
    throw error;
  }
}

// Buscar usuários que existem no LDAP
export async function buscarUsuariosAtivosLDAP() {
  try {
    const usuarios = await prisma.usuarioExoneradoTransferido.findMany({
      where: { existe_ldap: true },
      orderBy: { nome: "asc" },
    });

    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários ativos no LDAP:", error);
    throw error;
  }
}

// Buscar usuários que não existem no LDAP
export async function buscarUsuariosInativosLDAP() {
  try {
    const usuarios = await prisma.usuarioExoneradoTransferido.findMany({
      where: { existe_ldap: false },
      orderBy: { nome: "asc" },
    });

    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários inativos no LDAP:", error);
    throw error;
  }
}

// Deletar usuário exonerado
export async function deletarUsuarioExonerado(username: string) {
  try {
    const usuario = await prisma.usuarioExoneradoTransferido.delete({
      where: { username },
    });

    return usuario;
  } catch (error) {
    console.error("Erro ao deletar usuário exonerado:", error);
    throw error;
  }
}

// Estatísticas
export async function obterEstatisticasExonerados() {
  try {
    const total = await prisma.usuarioExoneradoTransferido.count();
    const ativosLDAP = await prisma.usuarioExoneradoTransferido.count({
      where: { existe_ldap: true },
    });
    const inativosLDAP = await prisma.usuarioExoneradoTransferido.count({
      where: { existe_ldap: false },
    });

    const porStatus = await prisma.usuarioExoneradoTransferido.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    return {
      total,
      ativosLDAP,
      inativosLDAP,
      porStatus: porStatus.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
    };
  } catch (error) {
    console.error("Erro ao obter estatísticas:", error);
    throw error;
  }
}
