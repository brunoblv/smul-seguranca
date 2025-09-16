"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Users,
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Eye,
} from "lucide-react";

interface UsuarioAtivo {
  id: number;
  username: string;
  nome: string;
  email?: string;
  departamento_ldap?: string;
  departamento_sgu?: string;
  cargo?: string;
  vinculo?: string;
  rf?: string;
  existe_ldap: boolean;
  status: string;
  data_verificacao: string;
  observacoes?: string;
}

interface Estatisticas {
  total: number;
  ativosLDAP: number;
  inativosLDAP: number;
  porStatus: Array<{
    status: string;
    count: number;
  }>;
}

export default function ServidoresAtivos() {
  const [usuarios, setUsuarios] = useState<UsuarioAtivo[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroLDAP, setFiltroLDAP] = useState<string>("todos");

  const carregarUsuarios = async () => {
    setIsLoading(true);
    try {
      let url = "/api/exonerados";
      const params = new URLSearchParams();

      if (filtroStatus !== "todos") {
        params.append("status", filtroStatus);
      }
      if (filtroLDAP !== "todos") {
        params.append("ativoLDAP", filtroLDAP);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUsuarios(data.data || []);
        setEstatisticas(
          data.estatisticas || {
            total: 0,
            ativosLDAP: 0,
            inativosLDAP: 0,
            porStatus: [],
          }
        );
      } else {
        console.error("Erro ao carregar usuários:", data.message);
        setUsuarios([]);
        setEstatisticas({
          total: 0,
          ativosLDAP: 0,
          inativosLDAP: 0,
          porStatus: [],
        });
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setUsuarios([]);
      setEstatisticas({
        total: 0,
        ativosLDAP: 0,
        inativosLDAP: 0,
        porStatus: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processarUsuarios = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/exonerados/processar", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        alert(
          `Processamento concluído!\n\nUsuários do SGU: ${data.summary.sgu}\nVerificados no LDAP: ${data.summary.ldap}\nSalvos: ${data.summary.salvos}`
        );
        carregarUsuarios();
      } else {
        alert(`Erro no processamento: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro no processamento:", error);
      alert("Erro no processamento dos usuários");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportarCSV = () => {
    const headers = [
      "Username",
      "Nome",
      "Email",
      "Departamento LDAP",
      "Departamento SGU",
      "Cargo",
      "Vínculo",
      "RF",
      "Existe LDAP",
      "Status",
      "Data Verificação",
      "Observações",
    ];

    const csvContent = [
      headers.join(","),
      ...usuarios.map((usuario) =>
        [
          usuario.username,
          `"${usuario.nome}"`,
          usuario.email || "",
          `"${usuario.departamento_ldap || ""}"`,
          `"${usuario.departamento_sgu || ""}"`,
          `"${usuario.cargo || ""}"`,
          usuario.vinculo || "",
          usuario.rf || "",
          usuario.existe_ldap ? "Sim" : "Não",
          usuario.status,
          new Date(usuario.data_verificacao).toLocaleDateString(),
          `"${usuario.observacoes || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `servidores_ativos_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ATIVO_LDAP":
        return "bg-green-100 text-green-800";
      case "INATIVO_LDAP":
        return "bg-red-100 text-red-800";
      case "EXONERADO":
        return "bg-red-100 text-red-800";
      case "TRANSFERIDO":
        return "bg-blue-100 text-blue-800";
      case "LIP":
        return "bg-yellow-100 text-yellow-800";
      case "AFASTADO_PARA_OUTRO_ORGAO":
        return "bg-orange-100 text-orange-800";
      case "LICENCA_MEDICA":
        return "bg-purple-100 text-purple-800";
      case "PENDENTE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ATIVO_LDAP":
        return "Ativo LDAP";
      case "INATIVO_LDAP":
        return "Inativo LDAP";
      case "EXONERADO":
        return "Exonerado";
      case "TRANSFERIDO":
        return "Transferido";
      case "LIP":
        return "LIP";
      case "AFASTADO_PARA_OUTRO_ORGAO":
        return "Afastado";
      case "LICENCA_MEDICA":
        return "Licença Médica";
      case "PENDENTE":
        return "Pendente";
      default:
        return status;
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, [filtroStatus, filtroLDAP]);

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
            Servidores Ativos
          </h1>
          <p className="text-lg text-slate-600">
            Gerenciamento de servidores sem "x" no campo cpUltimaCarga do SGU
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Estatísticas */}
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-600">Total</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {estatisticas.total}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-slate-600">Ativos LDAP</p>
                      <p className="text-2xl font-bold text-green-600">
                        {estatisticas.ativosLDAP}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-slate-600">Inativos LDAP</p>
                      <p className="text-2xl font-bold text-red-600">
                        {estatisticas.inativosLDAP}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {estatisticas.porStatus.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Controles */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Controles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <Button
                  onClick={processarUsuarios}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {isProcessing ? "Processando..." : "Processar Usuários"}
                </Button>

                <Button
                  onClick={carregarUsuarios}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Atualizar
                </Button>

                <Button
                  onClick={exportarCSV}
                  disabled={usuarios.length === 0}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>

                <div className="flex gap-2">
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Status</SelectItem>
                      <SelectItem value="ATIVO_LDAP">Ativo LDAP</SelectItem>
                      <SelectItem value="INATIVO_LDAP">Inativo LDAP</SelectItem>
                      <SelectItem value="EXONERADO">Exonerado</SelectItem>
                      <SelectItem value="TRANSFERIDO">Transferido</SelectItem>
                      <SelectItem value="LIP">LIP</SelectItem>
                      <SelectItem value="AFASTADO_PARA_OUTRO_ORGAO">
                        Afastado
                      </SelectItem>
                      <SelectItem value="LICENCA_MEDICA">
                        Licença Médica
                      </SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filtroLDAP} onValueChange={setFiltroLDAP}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="LDAP" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos LDAP</SelectItem>
                      <SelectItem value="true">Ativos LDAP</SelectItem>
                      <SelectItem value="false">Inativos LDAP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Usuários */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Usuários ({usuarios.length})
              </CardTitle>
              <CardDescription>
                Lista de servidores ativos do SGU (sem "x" no cpUltimaCarga)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Carregando usuários...</span>
                </div>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Nenhum usuário encontrado</p>
                  <p className="text-sm">
                    Clique em "Processar Usuários" para buscar dados do SGU
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Usuário</th>
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Departamento</th>
                        <th className="text-left p-2">Cargo</th>
                        <th className="text-left p-2">LDAP</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr
                          key={usuario.id}
                          className="border-b hover:bg-slate-50"
                        >
                          <td className="p-2 font-mono text-sm">
                            {usuario.username}
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{usuario.nome}</div>
                              {usuario.email && (
                                <div className="text-sm text-slate-500">
                                  {usuario.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              {usuario.departamento_ldap && (
                                <div className="text-slate-600">
                                  LDAP: {usuario.departamento_ldap}
                                </div>
                              )}
                              {usuario.departamento_sgu && (
                                <div className="text-blue-600">
                                  SGU: {usuario.departamento_sgu}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-sm">
                            {usuario.cargo || "-"}
                          </td>
                          <td className="p-2">
                            {usuario.existe_ldap ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inativo
                              </Badge>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge className={getStatusColor(usuario.status)}>
                              {getStatusLabel(usuario.status)}
                            </Badge>
                          </td>
                          <td className="p-2 text-sm text-slate-500">
                            {new Date(
                              usuario.data_verificacao
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
