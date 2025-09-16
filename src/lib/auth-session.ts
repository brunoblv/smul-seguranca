import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { buscarUsuarioPorUsername, usuarioTemPermissao } from "./auth-database";
import { Permissao } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "seguranca-smul-secret-key-2024";
const JWT_EXPIRES_IN = "24h";

export interface SessionUser {
  id: number;
  username: string;
  nome: string;
  email?: string;
  admin: boolean;
  permissoes: string[];
}

export interface JWTPayload {
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

// Gerar token JWT
export function gerarToken(usuario: SessionUser): string {
  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    userId: usuario.id,
    username: usuario.username,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Verificar token JWT
export function verificarToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    return null;
  }
}

// Extrair token do request
export function extrairToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Tentar extrair do cookie
  const tokenCookie = request.cookies.get("auth-token");
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

// Obter usuário da sessão
export async function obterUsuarioSessao(
  request: NextRequest
): Promise<SessionUser | null> {
  try {
    const token = extrairToken(request);
    if (!token) {
      return null;
    }

    const payload = verificarToken(token);
    if (!payload) {
      return null;
    }

    const usuario = await buscarUsuarioPorUsername(payload.username);
    if (!usuario || !usuario.ativo) {
      return null;
    }

    return {
      id: usuario.id,
      username: usuario.username,
      nome: usuario.nome,
      email: usuario.email || undefined,
      admin: usuario.admin,
      permissoes: usuario.permissoes.map((p) => p.permissao),
    };
  } catch (error) {
    console.error("Erro ao obter usuário da sessão:", error);
    return null;
  }
}

// Verificar se usuário tem permissão
export async function verificarPermissao(
  request: NextRequest,
  permissao: Permissao
): Promise<boolean> {
  try {
    const usuario = await obterUsuarioSessao(request);
    if (!usuario) {
      return false;
    }

    // Administradores têm todas as permissões
    if (usuario.admin) {
      return true;
    }

    // Verificar se tem a permissão específica
    return usuario.permissoes.includes(permissao);
  } catch (error) {
    console.error("Erro ao verificar permissão:", error);
    return false;
  }
}

// Middleware para verificar autenticação
export async function verificarAutenticacao(
  request: NextRequest
): Promise<SessionUser | null> {
  return await obterUsuarioSessao(request);
}

// Middleware para verificar permissão específica
export async function verificarPermissaoMiddleware(
  request: NextRequest,
  permissao: Permissao
): Promise<{ usuario: SessionUser | null; autorizado: boolean }> {
  const usuario = await obterUsuarioSessao(request);

  if (!usuario) {
    return { usuario: null, autorizado: false };
  }

  const autorizado = usuario.admin || usuario.permissoes.includes(permissao);
  return { usuario, autorizado };
}

// Gerar resposta de erro de autenticação
export function respostaNaoAutorizado(message: string = "Não autorizado") {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      error: "UNAUTHORIZED",
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

// Gerar resposta de erro de permissão
export function respostaSemPermissao(message: string = "Sem permissão") {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      error: "FORBIDDEN",
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
