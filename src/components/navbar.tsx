"use client";

import { LogoutButton } from "@/components/logout-button";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { isAdmin, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="hidden font-bold sm:inline-block">
              Segurança SMUL
            </span>
          </a>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <a
            href="/"
            className="transition-colors hover:text-gray-900 text-gray-600"
          >
            Início
          </a>
          <a
            href="/consulta-individual"
            className="transition-colors hover:text-gray-900 text-gray-600"
          >
            Consulta Individual
          </a>
          <a
            href="/usuarios-inativos"
            className="transition-colors hover:text-gray-900 text-gray-600"
          >
            Usuários Inativos
          </a>
          <a
            href="/seguranca-usuarios"
            className="transition-colors hover:text-gray-900 text-gray-600"
          >
            Gerenciar Assinaturas
          </a>
          {!loading && isAdmin && (
            <>
              <a
                href="/gerenciar-tickets"
                className="transition-colors hover:text-gray-900 text-gray-600"
              >
                Gerenciar Tickets
              </a>
              <a
                href="/gerenciar-usuarios"
                className="transition-colors hover:text-gray-900 text-gray-600"
              >
                Gerenciar Usuários
              </a>
              <a
                href="/comparacao-mensal"
                className="transition-colors hover:text-gray-900 text-gray-600"
              >
                Comparação Mensal
              </a>
            </>
          )}
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
