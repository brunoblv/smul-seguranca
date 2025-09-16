"use client";

import { useState, useEffect } from "react";
import "./table-styles.css";
import { formatarDataBrasileira, formatarDataSimples } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Ticket {
  id: number;
  username: string;
  nome: string;
  email?: string;
  departamento?: string;
  empresa?: string;
  status_ldap: string;
  ultimo_login?: string;
  dias_sem_logar?: number;
  status_sgu: string;
  setor_sgu?: string;
  status_ticket: string;
  observacoes?: string;
  data_criacao: string;
  data_atualizacao: string;
  servidor_origem?: string;
  ou_origem?: string;
}

interface Estatisticas {
  total: number;
  porStatusTicket: Array<{
    status_ticket: string;
    _count: { status_ticket: number };
  }>;
  porStatusLDAP: Array<{
    status_ldap: string;
    _count: { status_ldap: number };
  }>;
  porStatusSGU: Array<{ status_sgu: string; _count: { status_sgu: number } }>;
}

export default function GerenciarTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    status_ticket: "",
    status_ldap: "",
    status_sgu: "",
    dias_sem_logar_min: "",
  });
  const [pesquisaIndividual, setPesquisaIndividual] = useState("");
  const [pesquisaLote, setPesquisaLote] = useState("");
  const [itemsPerPage] = useState(20);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Carregar tickets e estatísticas
  const carregarDados = async () => {
    try {
      setLoading(true);

      // Carregar tickets
      const params = new URLSearchParams();
      if (filtros.status_ticket)
        params.append("status_ticket", filtros.status_ticket);
      if (filtros.status_ldap)
        params.append("status_ldap", filtros.status_ldap);
      if (filtros.status_sgu) params.append("status_sgu", filtros.status_sgu);
      if (filtros.dias_sem_logar_min)
        params.append("dias_sem_logar_min", filtros.dias_sem_logar_min);

      const [ticketsRes, estatisticasRes] = await Promise.all([
        fetch(`/api/tickets?${params.toString()}`),
        fetch("/api/tickets/estatisticas"),
      ]);

      const ticketsData = await ticketsRes.json();
      const estatisticasData = await estatisticasRes.json();

      if (ticketsData.success) {
        setTickets(ticketsData.data);
      }

      if (estatisticasData.success) {
        setEstatisticas(estatisticasData.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtros]);

  // Pesquisa individual
  const handlePesquisaIndividual = async () => {
    if (!pesquisaIndividual.trim()) return;

    try {
      const response = await fetch("/api/tickets/pesquisa-individual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: pesquisaIndividual.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Pesquisa realizada com sucesso!");
        setPesquisaIndividual("");
        carregarDados();
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro na pesquisa individual:", error);
      alert("Erro na pesquisa individual");
    }
  };

  // Pesquisa em lote
  const handlePesquisaLote = async () => {
    if (!pesquisaLote.trim()) return;

    const usernames = pesquisaLote
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (usernames.length === 0) return;

    try {
      const response = await fetch("/api/tickets/pesquisa-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `Pesquisa em lote concluída: ${data.data.tickets_criados} tickets processados`
        );
        setPesquisaLote("");
        carregarDados();
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro na pesquisa em lote:", error);
      alert("Erro na pesquisa em lote");
    }
  };

  // Atualizar status do ticket
  const atualizarStatusTicket = async (
    username: string,
    novoStatus: string
  ) => {
    try {
      const response = await fetch("/api/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          status_ticket: novoStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Status atualizado com sucesso!");
        carregarDados();
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status");
    }
  };

  // Função para obter cor do badge baseado no status
  const getStatusColor = (status: string, type: "ldap" | "sgu" | "ticket") => {
    const colors = {
      ldap: {
        ATIVO: "border-green-200 bg-green-50 text-green-700",
        BLOQUEADO: "border-red-200 bg-red-50 text-red-700",
        DESATIVO: "border-yellow-200 bg-yellow-50 text-yellow-700",
        NAO_ENCONTRADO: "border-gray-200 bg-gray-50 text-gray-700",
      },
      sgu: {
        ENCONTRADO: "border-green-200 bg-green-50 text-green-700",
        NAO_ENCONTRADO: "border-gray-200 bg-gray-50 text-gray-700",
      },
      ticket: {
        PENDENTE: "border-yellow-200 bg-yellow-50 text-yellow-700",
        EXCLUIR: "border-red-200 bg-red-50 text-red-700",
        MANTER: "border-green-200 bg-green-50 text-green-700",
        TRANSFERIR: "border-blue-200 bg-blue-50 text-blue-700",
        BLOQUEAR: "border-orange-200 bg-orange-50 text-orange-700",
        DESBLOQUEAR: "border-purple-200 bg-purple-50 text-purple-700",
      },
    };

    return colors[type][status] || "border-gray-200 bg-gray-50 text-gray-700";
  };

  // Mostrar todos os tickets (limitado a 20 para performance)
  const currentTickets = tickets.slice(0, itemsPerPage);

  // Detectar se há scroll disponível
  useEffect(() => {
    const checkScroll = () => {
      const tableContainer = document.querySelector(".overflow-y-auto");
      if (tableContainer) {
        setShowScrollIndicator(
          tableContainer.scrollHeight > tableContainer.clientHeight
        );
      }
    };

    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [tickets]);

  // Detectar quando o usuário rola
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(true);
    };

    const tableContainer = document.querySelector(".overflow-y-auto");
    if (tableContainer) {
      tableContainer.addEventListener("scroll", handleScroll);
      return () => tableContainer.removeEventListener("scroll", handleScroll);
    }
  }, [tickets]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gerenciar Tickets</h1>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total de Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Por Status Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {estatisticas.porStatusTicket.map((item) => (
                  <div
                    key={item.status_ticket}
                    className="flex justify-between"
                  >
                    <span className="text-sm">{item.status_ticket}:</span>
                    <span className="font-bold">
                      {item._count.status_ticket}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Por Status LDAP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {estatisticas.porStatusLDAP.map((item) => (
                  <div key={item.status_ldap} className="flex justify-between">
                    <span className="text-sm">{item.status_ldap}:</span>
                    <span className="font-bold">{item._count.status_ldap}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Por Status SGU</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {estatisticas.porStatusSGU.map((item) => (
                  <div key={item.status_sgu} className="flex justify-between">
                    <span className="text-sm">{item.status_sgu}:</span>
                    <span className="font-bold">{item._count.status_sgu}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pesquisas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pesquisa Individual */}
        <Card>
          <CardHeader>
            <CardTitle>Pesquisa Individual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Digite o username"
              value={pesquisaIndividual}
              onChange={(e) => setPesquisaIndividual(e.target.value)}
            />
            <Button onClick={handlePesquisaIndividual} className="w-full">
              Pesquisar
            </Button>
          </CardContent>
        </Card>

        {/* Pesquisa em Lote */}
        <Card>
          <CardHeader>
            <CardTitle>Pesquisa em Lote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full p-2 border rounded-md"
              rows={4}
              placeholder="Digite os usernames, um por linha"
              value={pesquisaLote}
              onChange={(e) => setPesquisaLote(e.target.value)}
            />
            <Button onClick={handlePesquisaLote} className="w-full">
              Pesquisar em Lote
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filtros.status_ticket || "todos"}
              onValueChange={(value) =>
                setFiltros({
                  ...filtros,
                  status_ticket: value === "todos" ? "" : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status Ticket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="EXCLUIR">Excluir</SelectItem>
                <SelectItem value="MANTER">Manter</SelectItem>
                <SelectItem value="TRANSFERIR">Transferir</SelectItem>
                <SelectItem value="BLOQUEAR">Bloquear</SelectItem>
                <SelectItem value="DESBLOQUEAR">Desbloquear</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.status_ldap || "todos"}
              onValueChange={(value) =>
                setFiltros({
                  ...filtros,
                  status_ldap: value === "todos" ? "" : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status LDAP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                <SelectItem value="DESATIVO">Desativo</SelectItem>
                <SelectItem value="NAO_ENCONTRADO">Não Encontrado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.status_sgu || "todos"}
              onValueChange={(value) =>
                setFiltros({
                  ...filtros,
                  status_sgu: value === "todos" ? "" : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status SGU" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ENCONTRADO">Encontrado</SelectItem>
                <SelectItem value="NAO_ENCONTRADO">Não Encontrado</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Dias sem logar (mínimo)"
              value={filtros.dias_sem_logar_min}
              onChange={(e) =>
                setFiltros({ ...filtros, dias_sem_logar_min: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tickets */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tickets ({tickets.length})</CardTitle>
            <div className="text-sm text-gray-500">
              Mostrando {Math.min(itemsPerPage, tickets.length)} de{" "}
              {tickets.length} tickets
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="sticky-table-container">
              <table className="sticky-table">
                <thead className="sticky-header">
                  <tr>
                    <th className="w-[50px]">ID</th>
                    <th className="w-[200px]">Usuário</th>
                    <th className="w-[150px]">Status LDAP</th>
                    <th className="w-[150px]">Status SGU</th>
                    <th className="w-[150px]">Status Ticket</th>
                    <th className="w-[150px]">Último Login / Dias Inativo</th>
                    <th className="w-[150px]">Departamento</th>
                    <th className="w-[150px]">Setor SGU</th>
                    <th className="w-[200px]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTickets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8">
                        <div className="text-gray-500">
                          {tickets.length === 0
                            ? "Nenhum ticket encontrado"
                            : "Nenhum ticket nesta página"}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="font-medium">{ticket.id}</td>
                        <td>
                          <div>
                            <div className="font-medium">{ticket.nome}</div>
                            <div className="text-sm text-gray-500">
                              @{ticket.username}
                            </div>
                            {ticket.email && (
                              <div className="text-sm text-gray-500">
                                {ticket.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge
                            variant="outline"
                            className={getStatusColor(
                              ticket.status_ldap,
                              "ldap"
                            )}
                          >
                            {ticket.status_ldap}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            variant="outline"
                            className={getStatusColor(ticket.status_sgu, "sgu")}
                          >
                            {ticket.status_sgu}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            variant="outline"
                            className={getStatusColor(
                              ticket.status_ticket,
                              "ticket"
                            )}
                          >
                            {ticket.status_ticket}
                          </Badge>
                        </td>
                        <td>
                          <div className="text-sm">
                            <div className="font-medium">
                              {ticket.ultimo_login
                                ? formatarDataSimples(ticket.ultimo_login)
                                : "Nunca"}
                            </div>
                            <div className="mt-1">
                              {ticket.dias_sem_logar ? (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      ticket.dias_sem_logar > 30
                                        ? "text-red-600 font-medium"
                                        : "text-gray-600"
                                    }
                                  >
                                    {ticket.dias_sem_logar} dias
                                  </span>
                                  {ticket.dias_sem_logar > 30 && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      Crítico
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">N/A</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            {ticket.departamento || "N/A"}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            {ticket.setor_sgu || "N/A"}
                          </div>
                        </td>
                        <td>
                          <Select
                            value={ticket.status_ticket}
                            onValueChange={(value) =>
                              atualizarStatusTicket(ticket.username, value)
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDENTE">Pendente</SelectItem>
                              <SelectItem value="EXCLUIR">Excluir</SelectItem>
                              <SelectItem value="MANTER">Manter</SelectItem>
                              <SelectItem value="TRANSFERIR">
                                Transferir
                              </SelectItem>
                              <SelectItem value="BLOQUEAR">Bloquear</SelectItem>
                              <SelectItem value="DESBLOQUEAR">
                                Desbloquear
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Indicador de Scroll */}
            {showScrollIndicator && !hasScrolled && (
              <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm shadow-lg animate-bounce">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  Role para ver mais
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
