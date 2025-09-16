import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas que não precisam de autenticação
const publicRoutes = ["/login", "/api/auth/login", "/api/auth/logout"];

// Rotas que precisam de autenticação
const protectedRoutes = [
  "/gerenciar-tickets",
  "/gerenciar-usuarios",
  "/api/tickets",
  "/api/usuarios",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota pública
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar se é uma rota protegida
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // Verificar se tem token de autenticação
    const token = request.cookies.get("auth-token");

    if (!token) {
      // Redirecionar para login se não estiver autenticado
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, message: "Não autenticado" },
          { status: 401 }
        );
      } else {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
