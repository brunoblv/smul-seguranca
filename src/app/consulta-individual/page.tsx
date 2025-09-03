"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  User,
  Mail,
  Building,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface UserResult {
  exists: boolean;
  username?: string;
  email?: string;
  displayName?: string;
  department?: string;
  error?: string;
}

export default function ConsultaIndividual() {
  const [searchType, setSearchType] = useState<
    "username" | "email" | "displayName"
  >("username");
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<UserResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ldap/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchType,
          searchValue: searchValue.trim(),
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        exists: false,
        error: "Erro ao conectar com o servidor LDAP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSearchTypeLabel = (type: string) => {
    switch (type) {
      case "username":
        return "Nome de Usuário";
      case "email":
        return "E-mail";
      case "displayName":
        return "Nome Completo";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Consulta Individual de Usuário
          </h1>
          <p className="text-lg text-slate-600">
            Pesquise um usuário específico no diretório LDAP
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Formulário de Busca */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">
                Buscar Usuário
              </CardTitle>
              <CardDescription>
                Selecione o tipo de busca e digite o valor para pesquisar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="searchType"
                    className="text-sm font-medium text-slate-700"
                  >
                    Tipo de Busca
                  </label>
                  <Select
                    value={searchType}
                    onValueChange={(value: any) => setSearchType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de busca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="username">Nome de Usuário</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="displayName">Nome Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="searchValue"
                    className="text-sm font-medium text-slate-700"
                  >
                    Valor para Busca
                  </label>
                  <Input
                    type="text"
                    id="searchValue"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={`Digite o ${getSearchTypeLabel(
                      searchType
                    ).toLowerCase()}`}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !searchValue.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Pesquisando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Search className="w-4 h-4 mr-2" />
                      Pesquisar Usuário
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resultado da Busca */}
          {result && (
            <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">
                  Resultado da Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.error ? (
                  <div className="flex items-start space-x-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">
                        Erro na busca
                      </p>
                      <p className="text-sm text-destructive/80 mt-1">
                        {result.error}
                      </p>
                    </div>
                  </div>
                ) : result.exists ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">
                          Usuário encontrado!
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {result.username && (
                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            Usuário:
                          </span>
                          <span className="text-sm text-slate-600">
                            {result.username}
                          </span>
                        </div>
                      )}
                      {result.displayName && (
                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            Nome:
                          </span>
                          <span className="text-sm text-slate-600">
                            {result.displayName}
                          </span>
                        </div>
                      )}
                      {result.email && (
                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            E-mail:
                          </span>
                          <span className="text-sm text-slate-600">
                            {result.email}
                          </span>
                        </div>
                      )}
                      {result.department && (
                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                          <Building className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            Departamento:
                          </span>
                          <span className="text-sm text-slate-600">
                            {result.department}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">
                        Usuário não encontrado
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        O usuário não foi encontrado no diretório LDAP.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">
                Como usar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start space-x-3">
                  <Badge variant="outline" className="mt-0.5">
                    1
                  </Badge>
                  <div>
                    <p className="font-medium text-slate-700">
                      Nome de Usuário
                    </p>
                    <p>Digite o login do usuário (ex: jose.silva)</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge variant="outline" className="mt-0.5">
                    2
                  </Badge>
                  <div>
                    <p className="font-medium text-slate-700">E-mail</p>
                    <p>
                      Digite o endereço de e-mail completo (ex:
                      jose.silva@rede.sp)
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge variant="outline" className="mt-0.5">
                    3
                  </Badge>
                  <div>
                    <p className="font-medium text-slate-700">Nome Completo</p>
                    <p>Digite o nome completo do usuário (ex: José Silva)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
