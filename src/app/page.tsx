"use client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  ArrowRight,
  Shield,
  Clock,
  Ticket,
  Lock,
  UserCheck,
  FileText,
  BarChart3,
  Building,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Sistema de Consulta LDAP
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Consulte usuários no diretório LDAP com uma interface moderna e
            intuitiva
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {/* Consulta Individual */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Consulta Individual
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Pesquise um usuário específico no diretório LDAP usando nome de
                usuário, email ou outros critérios
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                asChild
                size="lg"
                className="group-hover:bg-blue-600 transition-colors"
              >
                <Link
                  href="/consulta-individual"
                  className="inline-flex items-center gap-2"
                >
                  Consultar Usuário
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Usuários Inativos */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Usuários Inativos
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Identifique usuários que não fizeram login há mais de X dias em
                uma OU específica
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                asChild
                size="lg"
                className="group-hover:bg-blue-600 transition-colors"
              >
                <Link
                  href="/usuarios-inativos"
                  className="inline-flex items-center gap-2"
                >
                  Ver Usuários Inativos
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Gerenciar Tickets - Requer Login e Permissão */}
          <Card
            className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-lg backdrop-blur-sm ${
              !user || !isAdmin
                ? "bg-gray-100/80 opacity-75"
                : "bg-gradient-to-br from-purple-50 to-violet-100"
            }`}
          >
            <CardHeader className="text-center pb-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 ${
                  !user || !isAdmin ? "bg-gray-200" : "bg-green-100"
                }`}
              >
                {!user || !isAdmin ? (
                  <Lock className="w-8 h-8 text-gray-500" />
                ) : (
                  <Ticket className="w-8 h-8 text-green-600" />
                )}
              </div>
              <CardTitle
                className={`text-2xl ${
                  !user || !isAdmin ? "text-gray-500" : "text-gray-900"
                }`}
              >
                Gerenciar Tickets
              </CardTitle>
              <CardDescription
                className={`text-base ${
                  !user || !isAdmin ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {!user
                  ? "Faça login para acessar o sistema de tickets"
                  : !isAdmin
                  ? "Acesso restrito a administradores"
                  : "Gerencie tickets de usuários e suas ações"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {!user ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="group-hover:bg-gray-600 group-hover:text-white group-hover:border-gray-600 transition-colors"
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Fazer Login
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : !isAdmin ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    Usuário: {user.nome}
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    disabled
                    className="opacity-50 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Acesso Restrito
                  </Button>
                </div>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="group-hover:bg-green-600 transition-colors"
                >
                  <Link
                    href="/gerenciar-tickets"
                    className="inline-flex items-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    Gerenciar Tickets
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Gerenciar Assinaturas - Admin */}
          <Card
            className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-lg backdrop-blur-sm ${
              !user || !isAdmin
                ? "bg-gray-100/80 opacity-75"
                : "bg-gradient-to-br from-purple-50 to-violet-100"
            }`}
          >
            <CardHeader className="text-center pb-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 ${
                  !user || !isAdmin ? "bg-gray-200" : "bg-red-100"
                }`}
              >
                {!user || !isAdmin ? (
                  <Lock className="w-8 h-8 text-gray-500" />
                ) : (
                  <FileText className="w-8 h-8 text-red-600" />
                )}
              </div>
              <CardTitle
                className={`text-xl ${
                  !user || !isAdmin ? "text-gray-500" : "text-gray-900"
                }`}
              >
                Gerenciar Assinaturas
              </CardTitle>
              <CardDescription
                className={`text-sm ${
                  !user || !isAdmin ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {!user
                  ? "Faça login para acessar"
                  : !isAdmin
                  ? "Acesso restrito a administradores"
                  : "Gerencie assinaturas de usuários"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {!user ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="group-hover:bg-gray-600 group-hover:text-white transition-colors"
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Login
                  </Link>
                </Button>
              ) : !isAdmin ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="opacity-50"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Restrito
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="group-hover:bg-red-600 transition-colors"
                >
                  <Link
                    href="/seguranca-usuarios"
                    className="inline-flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Acessar
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Gerenciar Usuários - Admin */}
          <Card
            className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-lg backdrop-blur-sm ${
              !user || !isAdmin
                ? "bg-gray-100/80 opacity-75"
                : "bg-gradient-to-br from-purple-50 to-violet-100"
            }`}
          >
            <CardHeader className="text-center pb-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 ${
                  !user || !isAdmin ? "bg-gray-200" : "bg-green-100"
                }`}
              >
                {!user || !isAdmin ? (
                  <Lock className="w-8 h-8 text-gray-500" />
                ) : (
                  <UserCheck className="w-8 h-8 text-green-600" />
                )}
              </div>
              <CardTitle
                className={`text-xl ${
                  !user || !isAdmin ? "text-gray-500" : "text-gray-900"
                }`}
              >
                Gerenciar Usuários
              </CardTitle>
              <CardDescription
                className={`text-sm ${
                  !user || !isAdmin ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {!user
                  ? "Faça login para acessar"
                  : !isAdmin
                  ? "Acesso restrito a administradores"
                  : "Gerencie usuários do sistema"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {!user ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="group-hover:bg-gray-600 group-hover:text-white transition-colors"
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Login
                  </Link>
                </Button>
              ) : !isAdmin ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="opacity-50"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Restrito
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="group-hover:bg-green-600 transition-colors"
                >
                  <Link
                    href="/gerenciar-usuarios"
                    className="inline-flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Acessar
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Comparação Mensal - Admin */}
          <Card
            className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-lg backdrop-blur-sm ${
              !user || !isAdmin
                ? "bg-gray-100/80 opacity-75"
                : "bg-gradient-to-br from-purple-50 to-violet-100"
            }`}
          >
            <CardHeader className="text-center pb-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 ${
                  !user || !isAdmin ? "bg-gray-200" : "bg-orange-100"
                }`}
              >
                {!user || !isAdmin ? (
                  <Lock className="w-8 h-8 text-gray-500" />
                ) : (
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                )}
              </div>
              <CardTitle
                className={`text-xl ${
                  !user || !isAdmin ? "text-gray-500" : "text-gray-900"
                }`}
              >
                Comparação Mensal
              </CardTitle>
              <CardDescription
                className={`text-sm ${
                  !user || !isAdmin ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {!user
                  ? "Faça login para acessar"
                  : !isAdmin
                  ? "Acesso restrito a administradores"
                  : "Compare dados mensais"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {!user ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="group-hover:bg-gray-600 group-hover:text-white transition-colors"
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Login
                  </Link>
                </Button>
              ) : !isAdmin ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="opacity-50"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Restrito
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="group-hover:bg-orange-600 transition-colors"
                >
                  <Link
                    href="/comparacao-mensal"
                    className="inline-flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Acessar
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Gerenciar OUs - Admin */}
          <Card
            className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-lg backdrop-blur-sm ${
              !user || !isAdmin
                ? "bg-gray-100/80 opacity-75"
                : "bg-gradient-to-br from-purple-50 to-violet-100"
            }`}
          >
            <CardHeader className="text-center pb-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 ${
                  !user || !isAdmin ? "bg-gray-200" : "bg-purple-100"
                }`}
              >
                {!user || !isAdmin ? (
                  <Lock className="w-8 h-8 text-gray-500" />
                ) : (
                  <Building className="w-8 h-8 text-purple-600" />
                )}
              </div>
              <CardTitle
                className={`text-xl ${
                  !user || !isAdmin ? "text-gray-500" : "text-gray-900"
                }`}
              >
                Gerenciar OUs
              </CardTitle>
              <CardDescription
                className={`text-sm ${
                  !user || !isAdmin ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {!user
                  ? "Faça login para acessar"
                  : !isAdmin
                  ? "Acesso restrito a administradores"
                  : "Gerencie unidades organizacionais"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {!user ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="group-hover:bg-gray-600 group-hover:text-white transition-colors"
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Login
                  </Link>
                </Button>
              ) : !isAdmin ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="opacity-50"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Restrito
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="group-hover:bg-purple-600 transition-colors"
                >
                  <Link
                    href="/gerenciar-ous"
                    className="inline-flex items-center gap-2"
                  >
                    <Building className="w-4 h-4" />
                    Acessar
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
