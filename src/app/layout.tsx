import type { Metadata } from "next";
import "./globals.css";
import { LogoutButton } from "@/components/logout-button";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/contexts/AuthContext";

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
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60">
            <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
              <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                <p className="text-center text-sm leading-loose text-gray-600 md:text-left">
                  &copy; {new Date().getFullYear()} Segurança SMUL. Sistema de
                  Consulta de Usuários.
                </p>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
