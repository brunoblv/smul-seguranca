import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema de Consulta LDAP - Segurança SMUL",
  description: "Sistema para consulta de usuários em diretório LDAP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased" suppressHydrationWarning={true}>
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
                href="/consulta-lote"
                className="transition-colors hover:text-gray-900 text-gray-600"
              >
                Consulta em Lote
              </a>
              <a
                href="/usuarios-inativos"
                className="transition-colors hover:text-gray-900 text-gray-600"
              >
                Usuários Inativos
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60">
          <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
            <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
              <p className="text-center text-sm leading-loose text-gray-600 md:text-left">
                &copy; 2024 Segurança SMUL. Sistema de Consulta LDAP.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
