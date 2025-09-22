"use client";

import React, { useState, useEffect } from "react";
import "./table-styles.css";
import { formatarDataBrasileira, formatarDataSimples } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

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
  acao?: string;
  fechado: boolean;
  observacoes?: string;
  data_criacao: string;
  data_atualizacao: string;
  servidor_origem?: string;
  ou_origem?: string;
  criado_por?: string;
  fechado_por?: string;
  data_abertura?: string;
  data_fechamento?: string;
  alterado_por?: string;
  data_alteracao?: string;
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

interface TicketExport {
  id: number;
  username: string;
  nome: string;
  email?: string;
  status_ticket: string;
  status_ldap: string;
  status_sgu: string;
  ultimo_login?: string;
  dias_sem_logar?: number;
  empresa?: string;
  setor_sgu?: string;
  acao?: string;
  fechado: boolean;
  criado_por?: string;
  fechado_por?: string;
  data_criacao: string;
  data_fechamento?: string;
  observacoes?: string;
}

export default function GerenciarTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar filtros do localStorage
  const carregarFiltrosDoLocalStorage = () => {
    if (typeof window !== "undefined") {
      const filtrosSalvos = localStorage.getItem("filtros-tickets");
      if (filtrosSalvos) {
        try {
          return JSON.parse(filtrosSalvos);
        } catch (error) {
          console.error("Erro ao carregar filtros do localStorage:", error);
        }
      }
    }
    return {
      status_ticket: "",
      status_ldap: "",
      status_sgu: "",
      dias_sem_logar_min: "",
      fechado: "false", // Por padrão, mostrar apenas não fechados
      acao: "", // Filtro para ação do ticket
    };
  };

  const [filtros, setFiltros] = useState(carregarFiltrosDoLocalStorage);

  // useEffect para carregar filtros após a hidratação
  useEffect(() => {
    const filtrosCarregados = carregarFiltrosDoLocalStorage();
    setFiltros(filtrosCarregados);
  }, []);

  // Função para salvar filtros no localStorage
  const salvarFiltrosNoLocalStorage = (novosFiltros: typeof filtros) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("filtros-tickets", JSON.stringify(novosFiltros));
      } catch (error) {
        console.error("Erro ao salvar filtros no localStorage:", error);
      }
    }
  };

  // Função para atualizar filtros e salvar no localStorage
  const atualizarFiltros = (novosFiltros: typeof filtros) => {
    setFiltros(novosFiltros);
    salvarFiltrosNoLocalStorage(novosFiltros);
  };

  const [pesquisaUsuarios, setPesquisaUsuarios] = useState("");
  const [paginacao, setPaginacao] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 5,
  });
  const [linhasExpandidas, setLinhasExpandidas] = useState<Set<number>>(
    new Set()
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    show: boolean;
  }>({
    type: "success",
    message: "",
    show: false,
  });

  // Carregar tickets e estatísticas
  const carregarDados = async (page = 1) => {
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
      if (filtros.fechado) params.append("fechado", filtros.fechado);
      if (filtros.acao && filtros.acao.trim() !== "")
        params.append("acao", filtros.acao);
      params.append("page", page.toString());
      params.append("limit", "5");

      const [ticketsRes, estatisticasRes] = await Promise.all([
        fetch(`/api/tickets?${params.toString()}`),
        fetch("/api/tickets/estatisticas"),
      ]);

      const ticketsData = await ticketsRes.json();
      const estatisticasData = await estatisticasRes.json();

      if (ticketsData.success) {
        setTickets(ticketsData.data);
        if (ticketsData.pagination) {
          setPaginacao(ticketsData.pagination);
        }
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

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    carregarDados(1);
  }, []); // Array vazio = executa apenas uma vez

  // useEffect removido para desabilitar pesquisa automática
  // useEffect(() => {
  //   carregarDados(1); // Sempre voltar para a primeira página quando filtrar
  // }, [filtros]);

  // Funções de navegação de página
  const irParaPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= paginacao.totalPages) {
      carregarDados(pagina);
    }
  };

  const proximaPagina = () => {
    if (paginacao.currentPage < paginacao.totalPages) {
      irParaPagina(paginacao.currentPage + 1);
    }
  };

  const paginaAnterior = () => {
    if (paginacao.currentPage > 1) {
      irParaPagina(paginacao.currentPage - 1);
    }
  };

  const primeiraPagina = () => {
    irParaPagina(1);
  };

  const ultimaPagina = () => {
    irParaPagina(paginacao.totalPages);
  };

  // Funções para controlar expansão das linhas
  const toggleLinha = (ticketId: number) => {
    const novasLinhas = new Set(linhasExpandidas);
    if (novasLinhas.has(ticketId)) {
      novasLinhas.delete(ticketId);
    } else {
      novasLinhas.add(ticketId);
    }
    setLinhasExpandidas(novasLinhas);
  };

  const isLinhaExpandida = (ticketId: number) => {
    return linhasExpandidas.has(ticketId);
  };

  // Função para mostrar feedback
  const mostrarFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message, show: true });
    setTimeout(() => {
      setFeedback((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Pesquisa de usuários (individual ou em lote)
  const handlePesquisaUsuarios = async () => {
    if (!pesquisaUsuarios.trim()) return;

    const usernames = pesquisaUsuarios
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
        const quantidade = usernames.length;
        const texto = quantidade === 1 ? "usuário" : "usuários";
        alert(
          `Pesquisa concluída: ${data.data.tickets_criados} tickets processados de ${quantidade} ${texto}`
        );
        setPesquisaUsuarios("");
        carregarDados(1);
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro na pesquisa de usuários:", error);
      alert("Erro na pesquisa de usuários");
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
        carregarDados(paginacao.currentPage);
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status");
    }
  };

  // Atualizar ação do ticket
  const atualizarAcaoTicket = async (username: string, acao: string) => {
    try {
      const response = await fetch("/api/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          acao,
          status_ticket: "PENDENTE", // Manter status como PENDENTE ao atualizar ação
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar o ticket localmente sem recarregar a página
        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket.username === username
              ? {
                  ...ticket,
                  acao: acao,
                  data_alteracao:
                    data.data?.data_alteracao || ticket.data_alteracao,
                  alterado_por: data.data?.alterado_por || ticket.alterado_por,
                }
              : ticket
          )
        );
        mostrarFeedback("success", "Ação atualizada com sucesso!");
      } else {
        mostrarFeedback("error", `Erro: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar ação:", error);
      mostrarFeedback("error", "Erro ao atualizar ação");
    }
  };

  // Fechar ticket
  const fecharTicket = async (username: string) => {
    // Encontrar o ticket para verificar se tem ação definida
    const ticket = tickets.find((t) => t.username === username);

    if (!ticket) {
      mostrarFeedback("error", "Ticket não encontrado!");
      return;
    }

    if (!ticket.acao) {
      mostrarFeedback(
        "error",
        "É necessário definir uma ação antes de fechar o ticket!"
      );
      return;
    }

    if (!confirm("Tem certeza que deseja fechar este ticket?")) {
      return;
    }

    try {
      const response = await fetch("/api/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          fechado: true,
          status_ticket: "FECHADO",
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar o ticket localmente sem recarregar a página
        setTickets((prevTickets) =>
          prevTickets.map((t) =>
            t.username === username
              ? { ...t, fechado: true, status_ticket: "FECHADO" }
              : t
          )
        );
        mostrarFeedback("success", "Ticket fechado com sucesso!");
      } else {
        mostrarFeedback("error", `Erro: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao fechar ticket:", error);
      mostrarFeedback("error", "Erro ao fechar ticket");
    }
  };

  // Função para formatar status em português
  const formatarStatus = (
    status: string,
    type: "ldap" | "sgu" | "ticket" | "acao"
  ) => {
    const formatacoes: Record<string, Record<string, string>> = {
      ldap: {
        ATIVO: "Ativo",
        BLOQUEADO: "Bloqueado",
        DESATIVO: "Desativado",
        NAO_ENCONTRADO: "Não encontrado",
      },
      sgu: {
        ENCONTRADO: "Encontrado",
        NAO_ENCONTRADO: "Não encontrado",
      },
      ticket: {
        PENDENTE: "Pendente",
        FECHADO: "Fechado",
      },
      acao: {
        EXCLUIR: "Excluir",
        MANTER: "Manter",
        TRANSFERIR: "Transferir",
        TRANSFERIDO: "Transferido",
        SERVICO_OUTRO_ORGAO: "Serviço em outro órgão",
        BLOQUEAR: "Bloquear",
        DESBLOQUEAR: "Desbloquear",
        USUARIO_EXCLUIDO: "Usuário excluído",
      },
    };

    const valorFormatado = formatacoes[type][status] || status.toLowerCase();
    return valorFormatado.charAt(0).toUpperCase() + valorFormatado.slice(1);
  };

  // Função para exportar tickets para Excel
  const exportarParaExcel = async () => {
    try {
      setLoading(true);

      // Buscar todos os dados da pesquisa (sem paginação)
      const params = new URLSearchParams();
      if (filtros.status_ticket)
        params.append("status_ticket", filtros.status_ticket);
      if (filtros.status_ldap)
        params.append("status_ldap", filtros.status_ldap);
      if (filtros.status_sgu) params.append("status_sgu", filtros.status_sgu);
      if (filtros.dias_sem_logar_min)
        params.append("dias_sem_logar_min", filtros.dias_sem_logar_min);
      if (filtros.fechado) params.append("fechado", filtros.fechado);
      if (filtros.acao && filtros.acao.trim() !== "")
        params.append("acao", filtros.acao);
      // Sem paginação para buscar todos os dados
      params.append("page", "1"); // Página 1
      params.append("limit", "1000"); // Limite mais razoável para pegar todos os dados

      console.log("Exportando com filtros:", Object.fromEntries(params));

      const response = await fetch(`/api/tickets?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log("Response status:", response.status);
      console.log("Response data:", data);

      if (!data.success) {
        console.error("API Error:", data);
        throw new Error(data.message || "Erro ao buscar dados para exportação");
      }

      const todosTickets: TicketExport[] = data.data || [];

      // Se não conseguiu buscar dados da API, usar os dados da página atual como fallback
      if (todosTickets.length === 0) {
        console.warn(
          "Nenhum dado retornado da API, usando dados da página atual"
        );
        const dadosExportacao = tickets.map((ticket: Ticket) => ({
          ID: ticket.id,
          Username: ticket.username,
          Nome: ticket.nome,
          Email: ticket.email || "",
          "Status Ticket": formatarStatus(ticket.status_ticket, "ticket"),
          "Status Rede": formatarStatus(ticket.status_ldap, "ldap"),
          "Status SGU": formatarStatus(ticket.status_sgu, "sgu"),
          "Último Login": ticket.ultimo_login
            ? formatarDataSimples(ticket.ultimo_login)
            : "Nunca",
          "Dias Inativo": ticket.dias_sem_logar || 0,
          "Sec. AD": ticket.empresa || "N/A",
          SIGPEC: ticket.setor_sgu || "N/A",
          Ação: ticket.acao ? formatarStatus(ticket.acao, "acao") : "Nenhuma",
          Status: ticket.fechado ? "Fechado" : "Aberto",
          "Criado por": ticket.criado_por || "N/A",
          "Fechado por": ticket.fechado_por || "N/A",
          "Data Criação": formatarDataBrasileira(ticket.data_criacao),
          "Data Fechamento": ticket.data_fechamento
            ? formatarDataBrasileira(ticket.data_fechamento)
            : "N/A",
          Observações: ticket.observacoes || "",
        }));

        // Criar workbook com dados da página atual
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dadosExportacao);
        XLSX.utils.book_append_sheet(wb, ws, "Tickets");

        // Gerar nome do arquivo
        const agora = new Date();
        const dataHora = agora
          .toLocaleString("pt-BR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
          .replace(/[\/\s:]/g, "-");
        const nomeArquivo = `tickets-${dataHora}.xlsx`;

        // Fazer download
        XLSX.writeFile(wb, nomeArquivo);
        mostrarFeedback(
          "success",
          `Planilha exportada com sucesso! ${tickets.length} registros da página atual exportados.`
        );
        return;
      }

      // Preparar dados para exportação (dados completos da API)
      const dadosExportacao = todosTickets.map((ticket: TicketExport) => ({
        ID: ticket.id,
        Username: ticket.username,
        Nome: ticket.nome,
        Email: ticket.email || "",
        "Status Ticket": formatarStatus(ticket.status_ticket, "ticket"),
        "Status Rede": formatarStatus(ticket.status_ldap, "ldap"),
        "Status SGU": formatarStatus(ticket.status_sgu, "sgu"),
        "Último Login": ticket.ultimo_login
          ? formatarDataSimples(ticket.ultimo_login)
          : "Nunca",
        "Dias Inativo": ticket.dias_sem_logar || 0,
        "Sec. AD": ticket.empresa || "N/A",
        SIGPEC: ticket.setor_sgu || "N/A",
        Ação: ticket.acao ? formatarStatus(ticket.acao, "acao") : "Nenhuma",
        Status: ticket.fechado ? "Fechado" : "Aberto",
        "Criado por": ticket.criado_por || "N/A",
        "Fechado por": ticket.fechado_por || "N/A",
        "Data Criação": formatarDataBrasileira(ticket.data_criacao),
        "Data Fechamento": ticket.data_fechamento
          ? formatarDataBrasileira(ticket.data_fechamento)
          : "N/A",
        Observações: ticket.observacoes || "",
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosExportacao);

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 8 }, // ID
        { wch: 15 }, // Username
        { wch: 25 }, // Nome
        { wch: 30 }, // Email
        { wch: 15 }, // Status Ticket
        { wch: 15 }, // Status Rede
        { wch: 15 }, // Status SGU
        { wch: 15 }, // Último Login
        { wch: 12 }, // Dias Inativo
        { wch: 20 }, // Sec. AD
        { wch: 20 }, // SIGPEC
        { wch: 20 }, // Ação
        { wch: 10 }, // Status
        { wch: 15 }, // Criado por
        { wch: 15 }, // Fechado por
        { wch: 20 }, // Data Criação
        { wch: 20 }, // Data Fechamento
        { wch: 30 }, // Observações
      ];
      ws["!cols"] = colWidths;

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Tickets");

      // Gerar nome do arquivo com data e hora
      const agora = new Date();
      const dataHora = agora
        .toLocaleString("pt-BR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replace(/[\/\s:]/g, "-");

      const nomeArquivo = `tickets-${dataHora}.xlsx`;

      // Fazer download
      XLSX.writeFile(wb, nomeArquivo);

      mostrarFeedback(
        "success",
        `Planilha exportada com sucesso! ${todosTickets.length} registros exportados.`
      );
    } catch (error) {
      console.error("Erro ao exportar planilha:", error);
      mostrarFeedback("error", "Erro ao exportar planilha");
    } finally {
      setLoading(false);
    }
  };

  // Função para obter cor do badge baseado no status
  const getStatusColor = (
    status: string,
    type: "ldap" | "sgu" | "ticket" | "acao"
  ) => {
    const colors: Record<string, Record<string, string>> = {
      ldap: {
        ATIVO: "border-green-200 bg-green-50 text-green-700",
        BLOQUEADO: "border-red-200 bg-red-50 text-red-700",
        DESATIVO: "border-yellow-200 bg-yellow-50 text-yellow-700",
        NAO_ENCONTRADO: "border-red-200 bg-red-50 text-red-700",
      },
      sgu: {
        ENCONTRADO: "border-green-200 bg-green-50 text-green-700",
        NAO_ENCONTRADO: "border-red-200 bg-red-50 text-red-700",
      },
      ticket: {
        PENDENTE: "border-yellow-200 bg-yellow-50 text-yellow-700",
        FECHADO: "border-gray-200 bg-gray-50 text-gray-700",
      },
      acao: {
        EXCLUIR: "border-red-200 bg-red-50 text-red-700",
        MANTER: "border-green-200 bg-green-50 text-green-700",
        TRANSFERIR: "border-blue-200 bg-blue-50 text-blue-700",
        TRANSFERIDO: "border-cyan-200 bg-cyan-50 text-cyan-700",
        SERVICO_OUTRO_ORGAO: "border-indigo-200 bg-indigo-50 text-indigo-700",
        BLOQUEAR: "border-orange-200 bg-orange-50 text-orange-700",
        DESBLOQUEAR: "border-purple-200 bg-purple-50 text-purple-700",
        USUARIO_EXCLUIDO: "border-gray-200 bg-gray-50 text-gray-700",
      },
    };

    return colors[type][status] || "border-gray-200 bg-gray-50 text-gray-700";
  };

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

      {/* Dashboard de Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total de Tickets */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Total de Tickets
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {estatisticas.total}
              </div>
              <p className="text-xs text-blue-600 mt-1">tickets no sistema</p>
            </CardContent>
          </Card>

          {/* Status Ticket */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Status do Ticket
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estatisticas.porStatusTicket.map((item) => (
                  <div
                    key={item.status_ticket}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-green-800">
                      {formatarStatus(item.status_ticket, "ticket")}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-green-200 text-green-800"
                    >
                      {item._count.status_ticket}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Rede */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">
                Status da Rede
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                  />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estatisticas.porStatusLDAP.map((item) => (
                  <div
                    key={item.status_ldap}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-orange-800">
                      {formatarStatus(item.status_ldap, "ldap")}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-orange-200 text-orange-800"
                    >
                      {item._count.status_ldap}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status SGU */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                Status do SGU
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estatisticas.porStatusSGU.map((item) => (
                  <div
                    key={item.status_sgu}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-purple-800">
                      {formatarStatus(item.status_sgu, "sgu")}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-purple-200 text-purple-800"
                    >
                      {item._count.status_sgu}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pesquisa de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Usuários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pesquisa-usuarios">
              Digite o(s) username(s) - um por linha para múltiplos usuários
            </Label>
            <textarea
              id="pesquisa-usuarios"
              className="w-full p-2 border rounded-md mt-1"
              rows={4}
              placeholder="Exemplo:&#10;d123456&#10;d789012&#10;d345678"
              value={pesquisaUsuarios}
              onChange={(e) => setPesquisaUsuarios(e.target.value)}
            />
          </div>
          <Button onClick={handlePesquisaUsuarios} className="w-full">
            Pesquisar
          </Button>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-fechado">Status do Ticket</Label>
                <Select
                  value={
                    filtros.fechado === ""
                      ? "todos"
                      : filtros.fechado || "false"
                  }
                  onValueChange={(value) =>
                    atualizarFiltros({
                      ...filtros,
                      fechado: value === "todos" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger id="status-fechado">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="false">Abertos</SelectItem>
                    <SelectItem value="true">Fechados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-ldap">Status da Rede</Label>
                <Select
                  value={filtros.status_ldap || "todos"}
                  onValueChange={(value) =>
                    atualizarFiltros({
                      ...filtros,
                      status_ldap: value === "todos" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger id="status-ldap">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                    <SelectItem value="DESATIVO">Desativado</SelectItem>
                    <SelectItem value="NAO_ENCONTRADO">
                      Não Encontrado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-sgu">Status do SGU</Label>
                <Select
                  value={filtros.status_sgu || "todos"}
                  onValueChange={(value) =>
                    atualizarFiltros({
                      ...filtros,
                      status_sgu: value === "todos" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger id="status-sgu">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ENCONTRADO">Encontrado</SelectItem>
                    <SelectItem value="NAO_ENCONTRADO">
                      Não Encontrado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dias-sem-logar">Dias sem Logar (Mínimo)</Label>
                <Input
                  id="dias-sem-logar"
                  type="number"
                  placeholder="Digite o número de dias"
                  value={filtros.dias_sem_logar_min}
                  onChange={(e) =>
                    atualizarFiltros({
                      ...filtros,
                      dias_sem_logar_min: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="acao-ticket">Ação do Ticket</Label>
                <Select
                  value={filtros.acao || "todos"}
                  onValueChange={(value) =>
                    atualizarFiltros({
                      ...filtros,
                      acao: value === "todos" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger id="acao-ticket">
                    <SelectValue placeholder="Selecione a ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="EXCLUIR">Excluir</SelectItem>
                    <SelectItem value="MANTER">Manter</SelectItem>
                    <SelectItem value="TRANSFERIR">Transferir</SelectItem>
                    <SelectItem value="TRANSFERIDO">Transferido</SelectItem>
                    <SelectItem value="SERVICO_OUTRO_ORGAO">
                      Serviço em outro órgão
                    </SelectItem>
                    <SelectItem value="BLOQUEAR">Bloquear</SelectItem>
                    <SelectItem value="DESBLOQUEAR">Desbloquear</SelectItem>
                    <SelectItem value="USUARIO_EXCLUIDO">
                      Usuário excluído
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={() => carregarDados(1)}
                className="px-8"
                disabled={loading}
              >
                {loading ? "Pesquisando..." : "Pesquisar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tickets */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tickets ({tickets.length})</CardTitle>
            <div className="flex items-center gap-4">
              <Button
                onClick={exportarParaExcel}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Exportar Excel
              </Button>
              <div className="text-sm text-gray-500">
                Mostrando {tickets.length} tickets
              </div>
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
                    <th className="w-[150px]">Status Ticket</th>
                    <th className="w-[150px]">Status Rede</th>
                    <th className="w-[150px]">Status SGU</th>
                    <th className="w-[150px]">Último Login / Dias Inativo</th>
                    <th className="w-[200px]">Sec. AD / SIGPEC</th>
                    <th className="w-[200px]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8">
                        <div className="text-gray-500">
                          {tickets.length === 0
                            ? "Nenhum ticket encontrado"
                            : "Nenhum ticket nesta página"}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <React.Fragment key={ticket.id}>
                        {/* Linha principal */}
                        <tr className="hover:bg-gray-50">
                          <td className="font-medium">{ticket.id}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleLinha(ticket.id)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <svg
                                  className={`w-4 h-4 transition-transform ${
                                    isLinhaExpandida(ticket.id)
                                      ? "rotate-90"
                                      : ""
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                              <div>
                                <div className="font-medium text-sm">
                                  {ticket.nome}
                                </div>
                                <div className="text-xs text-gray-500">
                                  @{ticket.username}
                                </div>
                                {ticket.email && (
                                  <div className="text-xs text-gray-500">
                                    {ticket.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <Badge
                              variant="outline"
                              className={getStatusColor(
                                ticket.status_ticket,
                                "ticket"
                              )}
                            >
                              {formatarStatus(ticket.status_ticket, "ticket")}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              variant="outline"
                              className={getStatusColor(
                                ticket.status_ldap,
                                "ldap"
                              )}
                            >
                              {formatarStatus(ticket.status_ldap, "ldap")}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              variant="outline"
                              className={getStatusColor(
                                ticket.status_sgu,
                                "sgu"
                              )}
                            >
                              {formatarStatus(ticket.status_sgu, "sgu")}
                            </Badge>
                          </td>
                          <td>
                            <div className="text-xs">
                              <div className="font-medium">
                                {ticket.ultimo_login
                                  ? formatarDataSimples(ticket.ultimo_login)
                                  : "Nunca"}
                              </div>
                              <div className="mt-0">
                                {ticket.dias_sem_logar ? (
                                  <div className="flex items-center gap-1">
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
                                        className="text-xs px-1 py-0"
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
                            <div className="text-xs space-y-1">
                              <div>
                                <span className="text-gray-600 font-medium">
                                  Sec. AD:
                                </span>
                                <div
                                  className={`ml-2 ${
                                    ticket.empresa &&
                                    ticket.empresa.toUpperCase() !== "SMUL"
                                      ? "text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-200"
                                      : ""
                                  }`}
                                >
                                  {ticket.empresa || "N/A"}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600 font-medium">
                                  SIGPEC:
                                </span>
                                <div className="ml-2">
                                  {ticket.setor_sgu || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-left">
                            <div className="space-y-1">
                              {!ticket.fechado && (
                                <>
                                  <Select
                                    value={ticket.acao || ""}
                                    onValueChange={(value) =>
                                      atualizarAcaoTicket(
                                        ticket.username,
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-full h-7 text-xs">
                                      <SelectValue placeholder="Selecionar ação" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="EXCLUIR">
                                        Excluir
                                      </SelectItem>
                                      <SelectItem value="MANTER">
                                        Manter
                                      </SelectItem>
                                      <SelectItem value="TRANSFERIR">
                                        Transferir
                                      </SelectItem>
                                      <SelectItem value="TRANSFERIDO">
                                        Transferido
                                      </SelectItem>
                                      <SelectItem value="SERVICO_OUTRO_ORGAO">
                                        Serviço em outro órgão
                                      </SelectItem>
                                      <SelectItem value="BLOQUEAR">
                                        Bloquear
                                      </SelectItem>
                                      <SelectItem value="DESBLOQUEAR">
                                        Desbloquear
                                      </SelectItem>
                                      <SelectItem value="USUARIO_EXCLUIDO">
                                        Usuário excluído
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      fecharTicket(ticket.username)
                                    }
                                    className="w-full h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={!ticket.acao}
                                  >
                                    Fechar
                                  </Button>
                                </>
                              )}
                              {ticket.fechado && (
                                <div className="text-xs text-green-600 font-medium text-center">
                                  <Badge
                                    variant="outline"
                                    className={getStatusColor(
                                      ticket.acao || "FECHADO",
                                      "acao"
                                    )}
                                  >
                                    {ticket.acao
                                      ? formatarStatus(ticket.acao, "acao")
                                      : "fechado"}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Linha expandida com informações adicionais */}
                        {isLinhaExpandida(ticket.id) && (
                          <tr className="bg-gray-50 border-t">
                            <td></td>
                            <td colSpan={7} className="p-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-2">
                                    Informações de Auditoria
                                  </h4>
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        Criado por:
                                      </span>
                                      <span className="font-medium">
                                        {ticket.criado_por || "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        Fechado por:
                                      </span>
                                      <span className="font-medium">
                                        {ticket.fechado_por || "N/A"}
                                      </span>
                                    </div>
                                    {ticket.data_abertura && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Data abertura:
                                        </span>
                                        <span className="font-medium">
                                          {formatarDataBrasileira(
                                            ticket.data_abertura
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {ticket.data_fechamento && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Data fechamento:
                                        </span>
                                        <span className="font-medium">
                                          {formatarDataBrasileira(
                                            ticket.data_fechamento
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {ticket.alterado_por && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Última alteração por:
                                        </span>
                                        <span className="font-medium">
                                          {ticket.alterado_por}
                                        </span>
                                      </div>
                                    )}
                                    {ticket.data_alteracao && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Data alteração:
                                        </span>
                                        <span className="font-medium">
                                          {formatarDataBrasileira(
                                            ticket.data_alteracao
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium text-gray-700 mb-2">
                                    Ações
                                  </h4>
                                  <div className="space-y-2">
                                    <div>
                                      <label className="text-sm text-gray-600 block mb-1">
                                        Ação Atual:
                                      </label>
                                      {ticket.acao ? (
                                        <Badge
                                          variant="outline"
                                          className={getStatusColor(
                                            ticket.acao,
                                            "acao"
                                          )}
                                        >
                                          {formatarStatus(ticket.acao, "acao")}
                                        </Badge>
                                      ) : (
                                        <span className="text-gray-500 text-sm">
                                          Nenhuma ação definida
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <label className="text-sm text-gray-600 block mb-1">
                                        Definir Ação:
                                      </label>
                                      <Select
                                        value={ticket.acao || ""}
                                        onValueChange={(value) =>
                                          atualizarAcaoTicket(
                                            ticket.username,
                                            value
                                          )
                                        }
                                      >
                                        <SelectTrigger className="w-full h-8 text-xs">
                                          <SelectValue placeholder="Selecionar ação" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="EXCLUIR">
                                            Excluir
                                          </SelectItem>
                                          <SelectItem value="MANTER">
                                            Manter
                                          </SelectItem>
                                          <SelectItem value="TRANSFERIR">
                                            Transferir
                                          </SelectItem>
                                          <SelectItem value="TRANSFERIDO">
                                            Transferido
                                          </SelectItem>
                                          <SelectItem value="SERVICO_OUTRO_ORGAO">
                                            Serviço em outro órgão
                                          </SelectItem>
                                          <SelectItem value="BLOQUEAR">
                                            Bloquear
                                          </SelectItem>
                                          <SelectItem value="DESBLOQUEAR">
                                            Desbloquear
                                          </SelectItem>
                                          <SelectItem value="USUARIO_EXCLUIDO">
                                            Usuário excluído
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Controles de Paginação */}
            {paginacao.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>
                    Mostrando{" "}
                    {(paginacao.currentPage - 1) * paginacao.limit + 1} a{" "}
                    {Math.min(
                      paginacao.currentPage * paginacao.limit,
                      paginacao.total
                    )}{" "}
                    de {paginacao.total} tickets
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={primeiraPagina}
                    disabled={paginacao.currentPage === 1}
                    title="Primeira página"
                  >
                    Primeira
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={paginaAnterior}
                    disabled={paginacao.currentPage === 1}
                  >
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, paginacao.totalPages) },
                      (_, i) => {
                        const pageNum = i + 1;
                        const isCurrentPage = pageNum === paginacao.currentPage;

                        return (
                          <Button
                            key={pageNum}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => irParaPagina(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}

                    {paginacao.totalPages > 5 && (
                      <>
                        <span className="text-gray-500">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => irParaPagina(paginacao.totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {paginacao.totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={proximaPagina}
                    disabled={paginacao.currentPage === paginacao.totalPages}
                  >
                    Próxima
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={ultimaPagina}
                    disabled={paginacao.currentPage === paginacao.totalPages}
                    title="Última página"
                  >
                    Última
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Toast */}
      {feedback.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            feedback.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              {feedback.type === "success" ? (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
