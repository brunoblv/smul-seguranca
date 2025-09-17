import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Shield, Clock } from "lucide-react";

export default function Home() {
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
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
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
                variant="outline"
                className="group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600 transition-colors"
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
        </div>

        {/* Info Section */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-gray-500 bg-white/60 px-4 py-2 rounded-full backdrop-blur-sm">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">
              Desenvolvido para Segurança SMUL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
