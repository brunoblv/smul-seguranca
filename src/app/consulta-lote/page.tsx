"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Papa from "papaparse";
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
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";

interface UserResult {
  username: string;
  exists: boolean;
  email?: string;
  displayName?: string;
  department?: string;
  departmentSgu?: string;
  error?: string;
}

interface CSVRow {
  username: string;
  [key: string]: string;
}

export default function ConsultaLote() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UserResult[]>([]);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [searchType, setSearchType] = useState<"username" | "email">(
    "username"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const parsedData = results.data as CSVRow[];
        console.log("CSV parseado:", parsedData);

        // Filtrar linhas vazias e validar estrutura
        const validData = parsedData.filter((row) => {
          return row && row.username && row.username.trim().length > 0;
        });

        console.log("Dados válidos:", validData);
        setCsvData(validData);

        if (validData.length === 0) {
          alert(
            "Nenhum usuário válido encontrado no arquivo CSV. Certifique-se de que há uma coluna 'username' com dados válidos."
          );
        }
      },
      error: (error) => {
        console.error("Erro ao processar CSV:", error);
        alert("Erro ao processar o arquivo CSV");
      },
    });
  };

  const handleSearch = async () => {
    if (csvData.length === 0) return;

    setIsLoading(true);
    setResults([]);

    try {
      // Extrair usuários válidos do CSV
      const users = csvData
        .map((row) => row.username)
        .filter((username) => username && username.trim().length > 0);

      console.log("Dados sendo enviados:", { searchType, users, csvData });

      if (users.length === 0) {
        alert("Nenhum usuário válido encontrado no arquivo CSV");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/ldap/batch-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchType,
          users,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro da API:", errorData);
        alert(`Erro: ${errorData.error || "Erro desconhecido"}`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Erro na busca em lote:", error);
      alert("Erro ao realizar a busca em lote");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResults = () => {
    if (results.length === 0) return;

    const csvContent = Papa.unparse(results);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "resultados_ldap.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSearchTypeLabel = (type: string) => {
    return type === "username" ? "Usuário de Rede" : "E-mail";
  };

  const getStatusBadge = (result: UserResult) => {
    if (result.error) {
      return <Badge variant="destructive">Erro</Badge>;
    } else if (result.exists) {
      return <Badge variant="default">Encontrado</Badge>;
    } else {
      return <Badge variant="secondary">Não encontrado</Badge>;
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
            Consulta em Lote
          </h1>
          <p className="text-lg text-slate-600">
            Faça upload de um arquivo CSV para consultar múltiplos usuários
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Configuração e Upload */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">
                Configuração da Busca
              </CardTitle>
              <CardDescription>
                Selecione o tipo de busca e faça upload do arquivo CSV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
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
                      <SelectItem value="username">Usuário de Rede</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Arquivo CSV
                  </label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {csvData.length > 0 && (
                <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {csvData.length} usuário(s) carregado(s) do arquivo CSV
                  </span>
                </div>
              )}

              <Button
                onClick={handleSearch}
                disabled={isLoading || csvData.length === 0}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Processando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Users className="w-4 h-4 mr-2" />
                    Iniciar Busca em Lote
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultados */}
          {results.length > 0 && (
            <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl text-slate-900">
                      Resultados da Busca
                    </CardTitle>
                    <CardDescription>
                      {results.length} usuários processados
                    </CardDescription>
                  </div>
                  <Button onClick={downloadResults} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {getSearchTypeLabel(searchType)}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          E-mail
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Departamento
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {results.map((result, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {result.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(result)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {result.displayName || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {result.email || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <div>
                              {result.department || "-"}
                              {result.departmentSgu && (
                                <div className="text-xs text-blue-600 mt-1">
                                  SGU: {result.departmentSgu}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-medium mb-2 text-slate-700">
                    Formato do arquivo CSV:
                  </p>
                  <div className="space-y-2">
                    <p>
                      • O arquivo deve ter uma coluna chamada
                      &rdquo;username&rdquo;
                    </p>
                    <p>• Cada linha deve conter um usuário de rede</p>
                    <p>• Exemplo de conteúdo:</p>
                    <div className="bg-slate-100 p-3 rounded text-xs font-mono">
                      username
                      <br />
                      jose.silva
                      <br />
                      maria.santos
                      <br />
                      joao.oliveira
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2 text-slate-700">
                    Tipos de busca:
                  </p>
                  <div className="space-y-1">
                    <p>
                      • <strong>Usuário de Rede:</strong> Busca pelo login do
                      usuário
                    </p>
                    <p>
                      • <strong>E-mail:</strong> Busca pelo endereço de e-mail
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2 text-slate-700">Resultados:</p>
                  <div className="space-y-1">
                    <p>• Após a busca, você pode baixar os resultados em CSV</p>
                    <p>
                      • Os resultados mostram se cada usuário foi encontrado ou
                      não
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
