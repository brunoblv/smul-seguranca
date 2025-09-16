import { prisma } from "./prisma";
import { Usuario, Permissao } from "@prisma/client";

export interface UsuarioComPermissoes extends Usuario {
  permissoes: { permissao: Permissao }[];
}

export interface CriarUsuarioData {
  username: string;
  nome: string;
  email?: string;
  admin?: boolean;
  permissoes?: Permissao[];
}

export interface AtualizarUsuarioData {
  nome?: string;
  email?: string;
  ativo?: boolean;
  admin?: boolean;
  permissoes?: Permissao[];
}

// Buscar usuário por username
export async function buscarUsuarioPorUsername(
  username: string
): Promise<UsuarioComPermissoes | null> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { username },
      include: {
        permissoes: {
          select: {
            permissao: true,
          },
        },
      },
    });

    return usuario;
  } catch (error) {
    console.error("Erro ao buscar usuário por username:", error);
    throw error;
  }
}

// Buscar usuário por ID
export async function buscarUsuarioPorId(
  id: number
): Promise<UsuarioComPermissoes | null> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        permissoes: {
          select: {
            permissao: true,
          },
        },
      },
    });

    return usuario;
  } catch (error) {
    console.error("Erro ao buscar usuário por ID:", error);
    throw error;
  }
}

// Listar todos os usuários
export async function listarUsuarios(): Promise<UsuarioComPermissoes[]> {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        permissoes: {
          select: {
            permissao: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return usuarios;
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    throw error;
  }
}

// Criar usuário
export async function criarUsuario(
  data: CriarUsuarioData
): Promise<UsuarioComPermissoes> {
  try {
    const usuario = await prisma.usuario.create({
      data: {
        username: data.username,
        nome: data.nome,
        email: data.email,
        admin: data.admin || false,
        permissoes: data.permissoes
          ? {
              create: data.permissoes.map((permissao) => ({
                permissao,
              })),
            }
          : undefined,
      },
      include: {
        permissoes: {
          select: {
            permissao: true,
          },
        },
      },
    });

    return usuario;
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
}

// Atualizar usuário
export async function atualizarUsuario(
  id: number,
  data: AtualizarUsuarioData
): Promise<UsuarioComPermissoes> {
  try {
    // Se há permissões para atualizar, primeiro remover as antigas
    if (data.permissoes !== undefined) {
      await prisma.usuarioPermissao.deleteMany({
        where: { usuario_id: id },
      });
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        nome: data.nome,
        email: data.email,
        ativo: data.ativo,
        admin: data.admin,
        permissoes: data.permissoes
          ? {
              create: data.permissoes.map((permissao) => ({
                permissao,
              })),
            }
          : undefined,
      },
      include: {
        permissoes: {
          select: {
            permissao: true,
          },
        },
      },
    });

    return usuario;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
}

// Atualizar último login
export async function atualizarUltimoLogin(username: string): Promise<void> {
  try {
    await prisma.usuario.update({
      where: { username },
      data: {
        ultimo_login: new Date(),
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar último login:", error);
    throw error;
  }
}

// Verificar se usuário tem permissão
export async function usuarioTemPermissao(
  username: string,
  permissao: Permissao
): Promise<boolean> {
  try {
    const usuario = await buscarUsuarioPorUsername(username);

    if (!usuario || !usuario.ativo) {
      return false;
    }

    // Administradores têm todas as permissões
    if (usuario.admin) {
      return true;
    }

    // Verificar se tem a permissão específica
    return usuario.permissoes.some((p) => p.permissao === permissao);
  } catch (error) {
    console.error("Erro ao verificar permissão:", error);
    return false;
  }
}

// Deletar usuário
export async function deletarUsuario(id: number): Promise<boolean> {
  try {
    await prisma.usuario.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return false;
  }
}

// Verificar se username já existe
export async function usernameExiste(username: string): Promise<boolean> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { username },
      select: { id: true },
    });

    return usuario !== null;
  } catch (error) {
    console.error("Erro ao verificar se username existe:", error);
    return false;
  }
}

// Verificar se email já existe
export async function emailExiste(email: string): Promise<boolean> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });

    return usuario !== null;
  } catch (error) {
    console.error("Erro ao verificar se email existe:", error);
    return false;
  }
}
