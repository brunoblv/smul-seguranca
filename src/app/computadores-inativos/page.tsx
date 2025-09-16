"use client";

import { useState, useEffect } from "react";
import { formatarDataSimples } from "@/lib/date-utils";
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
import { Input } from "@/components/ui/input";
import {
  Monitor,
  Filter,
  RefreshCw,
  Download,
  Search,
  User,
  UserCheck,
  UserX,
  Clock,
  Building,
  HardDrive,
  Wifi,
} from "lucide-react";
import Papa from "papaparse";

interface ComputadorInativo {
  id: number;
  nome_computador: string;
  ip_address?: string;
  mac_address?: string;
  departamento?: string;
  departamento_sgu?: string;
  usuario_responsavel?: string;
  ultimo_login: string;
  dias_inativos: number;
  status: string;
  data_criacao: string;
  data_atualizacao: string;
  servidor_origem: string;
  ou_origem: string;
  sistema_operacional?: string;
  versao_so?: string;
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

export default function ComputadoresInativosPage() {
  const [computadores, setComputadores] = useState<ComputadorInativo[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    status: "todos",
    diasMinimos: "",
    departamento: "",
    sistemaOperacional: "",
  });

  useEffect(() => {
    carregarComputadores();
    carregarEstatisticas();
  }, []);

  const carregarComputadores = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.status && filtros.status !== "todos")
        params.append("status", filtros.status);
      if (filtros.diasMinimos)
        params.append("diasMinimos", filtros.diasMinimos);
      if (filtros.departamento)
        params.append("departamento", filtros.departamento);
      if (filtros.sistemaOperacional)
        params.append("sistemaOperacional", filtros.sistemaOperacional);

      const url = `/api/computadores-inativos?${params}`;
      console.log("Carregando computadores de:", url);

      const response = await fetch(url);
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      setComputadores(data.computadores || []);
      console.log("Computadores carregados:", data.computadores?.length || 0);
    } catch (error) {
      console.error("Erro ao carregar computadores:", error);
      setComputadores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const response = await fetch(
        "/api/computadores-inativos?estatisticas=true"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Estatísticas carregadas:", data.estatisticas);
      setEstatisticas(data.estatisticas);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      setEstatisticas({
        total: 0,
        pendentes: 0,
        exonerados: 0,
        transferidos: 0,
        lip: 0,
        afastados: 0,
        licenca_medica: 0,
        usuario_coringa: 0,
        media_dias_inativos: 0,
      });
    }
  };

  const atualizarStatus = async (
    nomeComputador: string,
    novoStatus: string
  ) => {
    try {
      const response = await fetch(
        `/api/computadores-inativos/${nomeComputador}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: novoStatus }),
        }
      );

      if (response.ok) {
        await carregarComputadores();
        await carregarEstatisticas();
      } else {
        console.error("Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const buscarComputadoresLDAP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ldap/inactive-computers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          daysInactive: 30, // Padrão de 30 dias
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Resultado da busca LDAP:", data);

      alert(
        `Busca concluída!\n\nTotal encontrados: ${data.total}\nSalvos com sucesso: ${data.sucessos}\nErros: ${data.erros}`
      );

      // Recarregar a lista após a busca
      await carregarComputadores();
      await carregarEstatisticas();
    } catch (error) {
      console.error("Erro ao buscar computadores no LDAP:", error);
      alert(`Erro ao buscar computadores no LDAP: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const processarComputadores = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ldap/inactive-computers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          daysInactive: 30, // Padrão de 30 dias
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Resultado do processamento:", data);

      alert(
        `Processamento concluído!\n\nTotal encontrados: ${data.total}\nSalvos com sucesso: ${data.sucessos}\nErros: ${data.erros}`
      );

      // Recarregar a lista após o processamento
      await carregarComputadores();
      await carregarEstatisticas();
    } catch (error) {
      console.error("Erro ao processar computadores:", error);
      alert(`Erro ao processar computadores: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportarCSV = () => {
    const csv = Papa.unparse(computadores);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "computadores_inativos.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusConfig = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      statusConfig || { label: status, color: "bg-gray-100 text-gray-800" }
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Computadores Inativos
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie computadores que não fazem login há muito tempo
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={carregarComputadores} disabled={isLoading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button
            onClick={buscarComputadoresLDAP}
            disabled={isLoading}
            variant="outline"
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar no LDAP
          </Button>
          <Button
            onClick={processarComputadores}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Processar Computadores
          </Button>
          <Button onClick={exportarCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Monitor className="h-8 w-8 mx-auto mb-2 text-blue-600" />
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
              <HardDrive className="h-8 w-8 mx-auto mb-2 text-purple-600" />
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
                placeholder="Ex: TI"
                value={filtros.departamento}
                onChange={(e) =>
                  setFiltros({ ...filtros, departamento: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Sistema Operacional
              </label>
              <Input
                placeholder="Ex: Windows"
                value={filtros.sistemaOperacional}
                onChange={(e) =>
                  setFiltros({ ...filtros, sistemaOperacional: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={carregarComputadores} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Computadores */}
      <Card>
        <CardHeader>
          <CardTitle>Computadores Inativos ({computadores.length})</CardTitle>
          <CardDescription>
            Lista de computadores que não fazem login há muito tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400" />
              <p className="text-gray-500 mt-2">Carregando computadores...</p>
            </div>
          ) : computadores.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Nenhum computador encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Computador</th>
                    <th className="text-left p-3 font-medium">IP</th>
                    <th className="text-left p-3 font-medium">Departamento</th>
                    <th className="text-left p-3 font-medium">Usuário</th>
                    <th className="text-left p-3 font-medium">Sistema</th>
                    <th className="text-left p-3 font-medium">Último Login</th>
                    <th className="text-left p-3 font-medium">Dias Inativo</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {computadores.map((computador) => {
                    const statusConfig = getStatusConfig(computador.status);
                    return (
                      <tr
                        key={computador.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <div className="font-medium">
                            {computador.nome_computador}
                          </div>
                          {computador.mac_address && (
                            <div className="text-sm text-gray-500">
                              MAC: {computador.mac_address}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {computador.ip_address && (
                            <div className="flex items-center gap-1">
                              <Wifi className="h-4 w-4 text-gray-400" />
                              {computador.ip_address}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div>
                            {computador.departamento || "-"}
                            {computador.departamento_sgu && (
                              <div className="text-sm text-blue-600">
                                SGU: {computador.departamento_sgu}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {computador.usuario_responsavel || "-"}
                        </td>
                        <td className="p-3">
                          <div>
                            {computador.sistema_operacional || "-"}
                            {computador.versao_so && (
                              <div className="text-sm text-gray-500">
                                {computador.versao_so}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {formatarDataSimples(computador.ultimo_login)}
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-red-600">
                            {computador.dias_inativos} dias
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <Select
                            value={computador.status}
                            onValueChange={(value) =>
                              atualizarStatus(computador.nome_computador, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
