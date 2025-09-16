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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface TestResult {
  success: boolean;
  message: string;
  data?: {
    usuario: string;
    departamento: string | null;
    timestamp: string;
  };
  error?: string;
  timestamp: string;
}

export default function TesteSgu() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-sgu");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: "Erro ao conectar com a API",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
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
            Teste de Conexão SGU
          </h1>
          <p className="text-lg text-slate-600">
            Teste a conexão com o banco de dados SGU e busque o departamento do
            usuário d854440
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Botão de Teste */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Teste de Conexão
              </CardTitle>
              <CardDescription>
                Clique no botão abaixo para testar a conexão com o banco SGU e
                buscar o departamento do usuário d854440
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleTest}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando Conexão...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Database className="w-4 h-4 mr-2" />
                    Testar Conexão SGU
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultado do Teste */}
          {result && (
            <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900 flex items-center">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                  )}
                  Resultado do Teste
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center space-x-3">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Sucesso" : "Erro"}
                    </Badge>
                    <span className="text-sm text-slate-600">
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Mensagem */}
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700">{result.message}</p>
                  </div>

                  {/* Dados do Resultado */}
                  {result.success && result.data && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-green-800">
                            Usuário:
                          </span>
                          <span className="text-sm text-green-700">
                            {result.data.usuario}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-blue-800">
                            Departamento SGU:
                          </span>
                          <span className="text-sm text-blue-700 font-medium">
                            {result.data.departamento || "Não encontrado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Erro */}
                  {!result.success && result.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-800 mb-1">
                        Detalhes do Erro:
                      </p>
                      <p className="text-sm text-red-700">{result.error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações de Configuração */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">
                Configurações de Teste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start space-x-3">
                  <Badge variant="outline" className="mt-0.5">
                    Host
                  </Badge>
                  <div>
                    <p className="font-medium text-slate-700">Servidor SGU</p>
                    <p>10.75.32.125:3306</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge variant="outline" className="mt-0.5">
                    Banco
                  </Badge>
                  <div>
                    <p className="font-medium text-slate-700">Nome do Banco</p>
                    <p>SGU</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge variant="outline" className="mt-0.5">
                    Usuário
                  </Badge>
                  <div>
                    <p className="font-medium text-slate-700">
                      Usuário de Teste
                    </p>
                    <p>d854440</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge variant="outline" className="mt-0.5">
                    Query
                  </Badge>
                  <div>
                    <p className="font-medium text-slate-700">Consulta SQL</p>
                    <p className="font-mono text-xs">
                      SELECT cpnomesetor2 FROM tblUsuarios WHERE cpUsuarioRede =
                      'd854440'
                    </p>
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
