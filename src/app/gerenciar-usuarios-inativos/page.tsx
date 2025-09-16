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
import { Input } from "@/components/ui/input";
import {
  Users,
  Filter,
  RefreshCw,
  Download,
  Search,
  User,
  UserCheck,
  UserX,
  Clock,
  Building,
} from "lucide-react";
import Papa from "papaparse";

interface UsuarioInativo {
  id: number;
  username: string;
  nome: string;
  email?: string;
  departamento?: string;
  ultimo_login: string;
  dias_inativos: number;
  status:
    | "Exonerado"
    | "Transferido"
    | "LIP"
    | "Afastado para outro órgão"
    | "Licença Médica"
    | "Pendente";
  data_criacao: string;
  data_atualizacao: string;
  servidor_origem: string;
  ou_origem: string;
}

interface Estatisticas {
  total: number;
  pendentes: number;
  exonerados: number;
  transferidos: number;
  lip: number;
  afastados: number;
  licenca_medica: number;
  usuario_coringa: number;
  media_dias_inativos: number;
}

const STATUS_OPTIONS = [
  {
    value: "PENDENTE",
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "EXONERADO", label: "Exonerado", color: "bg-red-100 text-red-800" },
  {
    value: "TRANSFERIDO",
    label: "Transferido",
    color: "bg-blue-100 text-blue-800",
  },
  { value: "LIP", label: "LIP", color: "bg-purple-100 text-purple-800" },
  {
    value: "AFASTADO_PARA_OUTRO_ORGAO",
    label: "Afastado",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "LICENCA_MEDICA",
    label: "Licença Médica",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "USUARIO_CORINGA",
    label: "Usuário Coringa",
    color: "bg-gray-100 text-gray-800",
  },
];

export default function GerenciarUsuariosInativosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioInativo[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    status: "todos",
    diasMinimos: "",
    departamento: "",
  });

  useEffect(() => {
    carregarUsuarios();
    carregarEstatisticas();
  }, []);

  const carregarUsuarios = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.status && filtros.status !== "todos")
        params.append("status", filtros.status);
      if (filtros.diasMinimos)
        params.append("diasMinimos", filtros.diasMinimos);
      if (filtros.departamento)
        params.append("departamento", filtros.departamento);

      const response = await fetch(`/api/usuarios-inativos?${params}`);
      const data = await response.json();
      setUsuarios(data.usuarios || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const response = await fetch("/api/usuarios-inativos?stats=true");
      const data = await response.json();
      setEstatisticas(data.estatisticas);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const atualizarStatus = async (username: string, novoStatus: string) => {
    try {
      const response = await fetch(`/api/usuarios-inativos/${username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (response.ok) {
        // Atualizar lista local
        setUsuarios(
          usuarios.map((u) =>
            u.username === username ? { ...u, status: novoStatus as any } : u
          )
        );
        // Recarregar estatísticas
        carregarEstatisticas();
      } else {
        alert("Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status");
    }
  };

  const aplicarFiltros = () => {
    carregarUsuarios();
  };

  const limparFiltros = () => {
    setFiltros({ status: "", diasMinimos: "", departamento: "" });
    carregarUsuarios();
  };

  const exportarCSV = () => {
    const csvData = usuarios.map((u) => ({
      Username: u.username,
      Nome: u.nome,
      Email: u.email || "",
      Departamento: u.departamento || "",
      "Último Login": new Date(u.ultimo_login).toLocaleDateString("pt-BR"),
      "Dias Inativos": u.dias_inativos,
      Status: u.status,
      "Data Criação": new Date(u.data_criacao).toLocaleDateString("pt-BR"),
      "Servidor Origem": u.servidor_origem,
      "OU Origem": u.ou_origem,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `usuarios_inativos_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-100 text-gray-800"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gerenciar Usuários Inativos
          </h1>
          <p className="text-gray-600 mt-2">
            Controle e gerenciamento de usuários inativos pela equipe de
            segurança
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={carregarUsuarios} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportarCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{estatisticas.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold">{estatisticas.pendentes}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserX className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold">
                {estatisticas.exonerados}
              </div>
              <div className="text-sm text-gray-600">Exonerados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">
                {estatisticas.transferidos}
              </div>
              <div className="text-sm text-gray-600">Transferidos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserCheck className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{estatisticas.lip}</div>
              <div className="text-sm text-gray-600">LIP</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">{estatisticas.afastados}</div>
              <div className="text-sm text-gray-600">Afastados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">
                {estatisticas.licenca_medica}
              </div>
              <div className="text-sm text-gray-600">Licença Médica</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <div className="text-2xl font-bold">
                {estatisticas.usuario_coringa}
              </div>
              <div className="text-sm text-gray-600">Usuário Coringa</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <Select
                value={filtros.status}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Dias Mínimos
              </label>
              <Input
                type="number"
                placeholder="Ex: 30"
                value={filtros.diasMinimos}
                onChange={(e) =>
                  setFiltros({ ...filtros, diasMinimos: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Departamento
              </label>
              <Input
                placeholder="Ex: GABINETE"
                value={filtros.departamento}
                onChange={(e) =>
                  setFiltros({ ...filtros, departamento: e.target.value })
                }
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={aplicarFiltros} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button onClick={limparFiltros} variant="outline">
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Inativos ({usuarios.length})</CardTitle>
          <CardDescription>
            Clique no status para alterar o status do usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Username</th>
                    <th className="text-left p-3 font-medium">Nome</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Departamento</th>
                    <th className="text-left p-3 font-medium">Último Login</th>
                    <th className="text-left p-3 font-medium">Dias Inativos</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Data Criação</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">
                        {usuario.username}
                      </td>
                      <td className="p-3">{usuario.nome}</td>
                      <td className="p-3 text-sm">{usuario.email || "-"}</td>
                      <td className="p-3 text-sm">
                        {usuario.departamento || "-"}
                      </td>
                      <td className="p-3 text-sm">
                        {formatarData(usuario.ultimo_login)}
                      </td>
                      <td className="p-3 text-sm">
                        <Badge
                          variant={
                            usuario.dias_inativos > 365
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {usuario.dias_inativos} dias
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Select
                          value={usuario.status}
                          onValueChange={(value) =>
                            atualizarStatus(usuario.username, value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            {getStatusBadge(usuario.status)}
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-sm">
                        {formatarData(usuario.data_criacao)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usuarios.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum usuário encontrado com os filtros aplicados
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
