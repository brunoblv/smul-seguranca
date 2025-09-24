"use client";

import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/logout-button";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { isAdmin, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="/escudo.png"
              alt="Logo Segurança SMUL"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="hidden font-bold sm:inline-block">
              SMUL - Segurança
            </span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/"
            className="transition-colors hover:text-gray-900 text-gray-600"
          >
            Início
          </Link>
          <Link
            href="/consulta-individual"
            className="transition-colors hover:text-gray-900 text-gray-600"
          >
            Consulta Individual
          </Link>
          <Link
            href="/usuarios-inativos"
            className="transition-colors hover:text-gray-900 text-gray-600"
          >
            Usuários Inativos
          </Link>
          <Link
            href="/seguranca-usuarios"
            className="transition-colors hover:text-gray-900 text-gray-600"
          >
            Gerenciar Assinaturas
          </Link>
          {!loading && isAdmin && (
            <>
              <Link
                href="/gerenciar-tickets"
                className="transition-colors hover:text-gray-900 text-gray-600"
              >
                Gerenciar Tickets
              </Link>
              <Link
                href="/gerenciar-usuarios"
                className="transition-colors hover:text-gray-900 text-gray-600"
              >
                Gerenciar Usuários
              </Link>
              <Link
                href="/comparacao-mensal"
                className="transition-colors hover:text-gray-900 text-gray-600"
              >
                Comparação Mensal
              </Link>
              <Link
                href="/gerenciar-ous"
                className="transition-colors hover:text-gray-900 text-gray-600"
              >
                Gerenciar OUs
              </Link>
            </>
          )}
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
