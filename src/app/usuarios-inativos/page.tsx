"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Calendar, Download, RefreshCw } from "lucide-react";
import Papa from "papaparse";

interface OU {
  dn: string;
  name: string;
  description?: string;
}

interface InactiveUser {
  username: string;
  displayName: string;
  email?: string;
  department?: string;
  lastLogon?: string;
  daysInactive: number;
  ou: string;
  server: string;
}

interface InactiveUsersResponse {
  users: InactiveUser[];
  total: number;
  summary: {
    totalUsers: number;
    inactiveUsers: number;
    activeUsers: number;
  };
}

export default function UsuariosInativosPage() {
  const [ous, setOus] = useState<OU[]>([]);
  const [selectedOU, setSelectedOU] = useState<string>("");
  const [inactiveDays, setInactiveDays] = useState<30 | 45 | 60>(30);
  const [results, setResults] = useState<InactiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOUs, setIsLoadingOUs] = useState(false);
  const [summary, setSummary] = useState<
    InactiveUsersResponse["summary"] | null
  >(null);

  // Carrega as OUs automaticamente quando a página é carregada
  useEffect(() => {
    loadOUs();
  }, []);

  const loadOUs = async () => {
    setIsLoadingOUs(true);
    try {
      const response = await fetch("/api/ldap/ous");
      const data = await response.json();

      if (response.ok) {
        setOus(data.ous || []);
      } else {
        alert(`Erro ao carregar OUs: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao carregar OUs:", error);
      alert("Erro ao carregar lista de OUs");
    } finally {
      setIsLoadingOUs(false);
    }
  };

  const searchInactiveUsers = async () => {
    if (!selectedOU) {
      alert("Selecione uma OU para buscar usuários inativos");
      return;
    }

    setIsLoading(true);
    setResults([]);
    setSummary(null);

    try {
      const response = await fetch("/api/ldap/inactive-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ou: selectedOU,
          inactiveDays,
        }),
      });

      const data: InactiveUsersResponse = await response.json();

      if (response.ok) {
        setResults(data.users || []);
        setSummary(data.summary);
      } else {
        alert(`Erro na busca: ${data.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro na busca de usuários inativos:", error);
      alert("Erro ao buscar usuários inativos");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResults = () => {
    if (results.length === 0) return;

    const csvContent = Papa.unparse(
      results.map((user) => ({
        username: user.username,
        displayName: user.displayName,
        email: user.email || "",
        department: user.department || "",
        lastLogon: user.lastLogon || "Nunca",
        daysInactive: user.daysInactive,
        ou: user.ou,
        server: user.server,
      }))
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `usuarios_inativos_${inactiveDays}_dias_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatLastLogon = (lastLogon?: string) => {
    if (!lastLogon) return "Nunca";

    try {
      const date = new Date(lastLogon);
      return date.toLocaleString("pt-BR");
    } catch {
      return lastLogon;
    }
  };

  const getInactiveBadgeVariant = (days: number) => {
    if (days >= 60) return "destructive";
    if (days >= 45) return "secondary";
    return "default";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Users className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Usuários Inativos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Buscar Usuários Inativos por OU</span>
          </CardTitle>
          <CardDescription>
            Busque usuários que não fizeram login há mais de X dias em uma OU
            específica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Organização (OU)
              </label>
              <Select value={selectedOU} onValueChange={setSelectedOU}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingOUs ? "Carregando OUs..." : "Selecione uma OU"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {ous.map((ou) => (
                    <SelectItem key={ou.dn} value={ou.dn}>
                      {ou.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingOUs && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Carregando lista de OUs...</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Dias Inativos
              </label>
              <Select
                value={inactiveDays.toString()}
                onValueChange={(value) =>
                  setInactiveDays(parseInt(value) as 30 | 45 | 60)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="45">45 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ação</label>
              <Button
                onClick={searchInactiveUsers}
                disabled={isLoading || !selectedOU}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Buscar Usuários
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Resumo da Busca</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.totalUsers}
                </div>
                <div className="text-sm text-gray-600">Total de Usuários</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {summary.inactiveUsers}
                </div>
                <div className="text-sm text-gray-600">Usuários Inativos</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {summary.activeUsers}
                </div>
                <div className="text-sm text-gray-600">Usuários Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Usuários Inativos ({results.length} encontrados)
              </CardTitle>
              <Button onClick={downloadResults} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((user, index) => (
                <div
                  key={`${user.username}-${index}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.displayName || user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.username} •{" "}
                          {user.department || "Sem departamento"}
                        </div>
                        {user.email && (
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Último Login</div>
                      <div className="font-medium">
                        {formatLastLogon(user.lastLogon)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Dias Inativo</div>
                      <Badge
                        variant={getInactiveBadgeVariant(user.daysInactive)}
                      >
                        {user.daysInactive} dias
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Servidor</div>
                      <div className="text-xs text-gray-400">{user.server}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
