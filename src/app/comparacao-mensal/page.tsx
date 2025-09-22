"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UsuarioSgu {
  cpID: number;
  cpRF: string;
  cpNome: string;
  cpUnid: string;
  cpnomesetor2: string;
  cpEspecie?: string;
  sigla?: string;
  nome_unidade?: string;
}

interface ComparacaoResultado {
  exonerados: UsuarioSgu[];
  transferidos: Array<{
    usuario: UsuarioSgu;
    unidade_anterior: string;
    unidade_atual: string;
    sigla_anterior?: string;
    sigla_atual?: string;
  }>;
  total_exonerados: number;
  total_transferidos: number;
}

export default function ComparacaoMensal() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ComparacaoResultado | null>(null);
  const [filtros, setFiltros] = useState({
    unidade: "",
    status: "todos",
  });
  const [opcoesMes, setOpcoesMes] = useState<
    Array<{ valor: string; label: string }>
  >([]);
  const [carregandoTabelas, setCarregandoTabelas] = useState(true);
  const [statusLDAP, setStatusLDAP] = useState<Record<string, string>>({});

  // Verificar status LDAP de um usuário usando a mesma lógica da página principal
  const verificarStatusLDAP = async (username: string) => {
    try {
      const response = await fetch(`/api/ldap/search?username=${username}`);

      // Verificar se a resposta é válida
      if (!response.ok) {
        console.error(`Erro HTTP ${response.status} para ${username}`);
        return "Erro";
      }

      // Verificar se há conteúdo na resposta
      const text = await response.text();
      if (!text || text.trim() === "") {
        console.error(`Resposta vazia para ${username}`);
        return "Erro";
      }

      // Tentar fazer parse do JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error(
          `Erro ao fazer parse do JSON para ${username}:`,
          parseError
        );
        console.error(`Conteúdo da resposta:`, text);
        return "Erro";
      }

      if (data.success && data.data && data.data.length > 0) {
        const userData = data.data[0];

        // Usar a mesma lógica da página principal para determinar status
        if (!userData) {
          return "Não encontrado";
        }

        // Verificar se a conta está desabilitada
        if (userData.userAccountControl) {
          const uac = parseInt(userData.userAccountControl);
          // Bit 2 = ACCOUNTDISABLE
          if (uac & 2) {
            return "Desativado";
          }
        }

        // Verificar se a conta está bloqueada
        if (userData.lockoutTime && userData.lockoutTime !== "0") {
          return "Bloqueado";
        }

        // Se chegou até aqui, a conta está ativa
        return "Ativo";
      } else {
        return "Não encontrado";
      }
    } catch (error) {
      console.error(`Erro ao verificar LDAP para ${username}:`, error);
      return "Erro";
    }
  };

  // Verificar status LDAP de todos os usuários
  const verificarTodosStatusLDAP = async (usuarios: UsuarioSgu[]) => {
    const statusMap: Record<string, string> = {};

    for (const usuario of usuarios) {
      const username = `D${usuario.cpRF.substring(0, 6)}`;
      const status = await verificarStatusLDAP(username);
      statusMap[usuario.cpRF] = status;
    }

    setStatusLDAP(statusMap);
  };

  // Carregar tabelas disponíveis do banco
  const carregarTabelasDisponiveis = async () => {
    try {
      setCarregandoTabelas(true);
      const response = await fetch(
        "/api/comparacao-mensal/tabelas-disponiveis"
      );
      const data = await response.json();

      if (data.success) {
        setOpcoesMes(data.data.tabelas);
      } else {
        console.error("Erro ao carregar tabelas:", data.message);
        // Fallback para geração manual se a API falhar
        const opcoes = gerarOpcoesMesFallback();
        setOpcoesMes(opcoes);
      }
    } catch (error) {
      console.error("Erro ao carregar tabelas:", error);
      // Fallback para geração manual
      const opcoes = gerarOpcoesMesFallback();
      setOpcoesMes(opcoes);
    } finally {
      setCarregandoTabelas(false);
    }
  };

  // Fallback para gerar opções de mês (últimos 12 meses)
  const gerarOpcoesMesFallback = () => {
    const opcoes = [];
    const hoje = new Date();

    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const nomeMes = data.toLocaleString("pt-BR", { month: "long" });
      const valor = `${ano}_${mes}`;
      const label = `${nomeMes} ${ano}`;

      opcoes.push({ valor, label });
    }

    return opcoes;
  };

  // Carregar tabelas disponíveis e definir meses automaticamente
  useEffect(() => {
    carregarTabelasDisponiveis();
  }, []);

  // Comparar automaticamente quando as tabelas estiverem carregadas
  useEffect(() => {
    if (opcoesMes.length >= 2 && !carregandoTabelas) {
      // Usar as duas tabelas mais recentes
      const mesAtual = opcoesMes[0].valor;
      const mesAnterior = opcoesMes[1].valor;
      compararTabelasAutomatico(mesAtual, mesAnterior);
    }
  }, [opcoesMes, carregandoTabelas]);

  const compararTabelasAutomatico = async (
    mesAtualParam: string,
    mesAnteriorParam: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch("/api/comparacao-mensal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mesAtual: mesAtualParam,
          mesAnterior: mesAnteriorParam,
          filtros,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Dados recebidos da API:", data.data);
        console.log("Exonerados:", data.data.exonerados.length);
        console.log("Transferidos:", data.data.transferidos.length);
        setResultado(data.data);

        // Verificar status LDAP de todos os usuários encontrados
        const todosUsuarios = [
          ...data.data.exonerados,
          ...data.data.transferidos.map((t) => t.usuario),
        ];
        if (todosUsuarios.length > 0) {
          verificarTodosStatusLDAP(todosUsuarios);
        }
      } else {
        console.error(`Erro na comparação automática: ${data.message}`);
        // Não mostrar alert para comparação automática
      }
    } catch (error) {
      console.error("Erro ao comparar tabelas automaticamente:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirTicketsEmLote = async (
    usuarios: UsuarioSgu[],
    tipo: "exonerados" | "transferidos"
  ) => {
    try {
      const response = await fetch("/api/tickets/criar-lote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarios,
          tipo,
          observacoes:
            tipo === "exonerados"
              ? "Usuário identificado como exonerado/transferido na comparação mensal"
              : "Usuário identificado como transferido de unidade na comparação mensal",
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`${data.ticketsCriados} tickets criados com sucesso!`);
        // Recarregar a comparação
        compararTabelas();
      } else {
        alert(`Erro ao criar tickets: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao criar tickets:", error);
      alert("Erro ao criar tickets");
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Comparação Mensal SGU</h1>
        <Badge variant="outline" className="text-sm">
          Administração
        </Badge>
      </div>

      {/* Status da Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação Automática de Períodos</CardTitle>
          <p className="text-sm text-gray-600">
            Comparação automática entre o mês atual e o anterior
          </p>
        </CardHeader>
        <CardContent>
          {carregandoTabelas ? (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Carregando tabelas disponíveis...
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Comparando tabelas...
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-gray-600">
              Comparação concluída
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Input
                  id="unidade"
                  placeholder="Filtrar por unidade..."
                  value={filtros.unidade}
                  onChange={(e) =>
                    setFiltros({ ...filtros, unidade: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filtros.status}
                  onValueChange={(value) =>
                    setFiltros({ ...filtros, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="exonerados">
                      Apenas Exonerados
                    </SelectItem>
                    <SelectItem value="transferidos">
                      Apenas Transferidos
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados da Comparação */}
      {resultado && (
        <div className="space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">
                  Usuários Exonerados/Transferidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">
                  {resultado.total_exonerados}
                </div>
                <p className="text-sm text-red-600">
                  Usuários que estavam no mês anterior mas não estão no atual
                </p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-700">
                  Mudanças de Unidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-900">
                  {resultado.total_transferidos}
                </div>
                <p className="text-sm text-yellow-600">
                  Usuários que mudaram de unidade
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Exonerados */}
          {resultado.exonerados.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-red-700">
                    Usuários Exonerados/Transferidos (
                    {resultado.exonerados.length})
                  </CardTitle>
                  <Button
                    onClick={() =>
                      abrirTicketsEmLote(resultado.exonerados, "exonerados")
                    }
                    variant="destructive"
                    size="sm"
                  >
                    Abrir Tickets em Lote
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">RF</th>
                        <th className="text-left p-2">Username LDAP</th>
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Unidade Anterior</th>
                        <th className="text-left p-2">Status LDAP</th>
                        <th className="text-left p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.exonerados
                        .filter((usuario) => {
                          const passaFiltro =
                            filtros.unidade === "" ||
                            usuario.cpUnid.includes(filtros.unidade) ||
                            usuario.sigla
                              ?.toLowerCase()
                              .includes(filtros.unidade.toLowerCase());
                          console.log(
                            `Usuário ${usuario.cpRF} passa no filtro:`,
                            passaFiltro
                          );
                          return passaFiltro;
                        })
                        .map((usuario) => (
                          <tr
                            key={usuario.cpRF}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-2 font-medium">{usuario.cpRF}</td>
                            <td className="p-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              D{usuario.cpRF.substring(0, 6)}
                            </td>
                            <td className="p-2">{usuario.cpNome}</td>
                            <td className="p-2">
                              <Badge
                                variant="outline"
                                className="bg-red-100 text-red-800"
                              >
                                {usuario.sigla || "N/A"}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Badge
                                variant="outline"
                                className={
                                  statusLDAP[usuario.cpRF] === "Ativo"
                                    ? "bg-green-100 text-green-800"
                                    : statusLDAP[usuario.cpRF] === "Desativado"
                                    ? "bg-red-100 text-red-800"
                                    : statusLDAP[usuario.cpRF] === "Bloqueado"
                                    ? "bg-orange-100 text-orange-800"
                                    : statusLDAP[usuario.cpRF] === "Erro"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {statusLDAP[usuario.cpRF] || "Verificando..."}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  abrirTicketsEmLote([usuario], "exonerados")
                                }
                              >
                                Abrir Ticket
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Transferidos */}
          {resultado.transferidos.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-yellow-700">
                    Mudanças de Unidade ({resultado.transferidos.length})
                  </CardTitle>
                  <Button
                    onClick={() =>
                      abrirTicketsEmLote(
                        resultado.transferidos.map((t) => t.usuario),
                        "transferidos"
                      )
                    }
                    variant="outline"
                    size="sm"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    Abrir Tickets em Lote
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">RF</th>
                        <th className="text-left p-2">Username LDAP</th>
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Unidade Anterior</th>
                        <th className="text-left p-2">Unidade Atual</th>
                        <th className="text-left p-2">Status LDAP</th>
                        <th className="text-left p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.transferidos
                        .filter(
                          (item) =>
                            filtros.unidade === "" ||
                            item.unidade_anterior.includes(filtros.unidade) ||
                            item.unidade_atual.includes(filtros.unidade) ||
                            item.sigla_anterior
                              ?.toLowerCase()
                              .includes(filtros.unidade.toLowerCase()) ||
                            item.sigla_atual
                              ?.toLowerCase()
                              .includes(filtros.unidade.toLowerCase())
                        )
                        .map((item, index) => (
                          <tr
                            key={`${item.usuario.cpRF}-${item.usuario.cpUnid}-${index}`}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-2 font-medium">
                              {item.usuario.cpRF}
                            </td>
                            <td className="p-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              D{item.usuario.cpRF.substring(0, 6)}
                            </td>
                            <td className="p-2">{item.usuario.cpNome}</td>
                            <td className="p-2">
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-800"
                              >
                                {item.sigla_anterior || "N/A"}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Badge
                                variant="outline"
                                className="bg-yellow-100 text-yellow-800"
                              >
                                {item.sigla_atual || "N/A"}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Badge
                                variant="outline"
                                className={
                                  statusLDAP[item.usuario.cpRF] === "Ativo"
                                    ? "bg-green-100 text-green-800"
                                    : statusLDAP[item.usuario.cpRF] ===
                                      "Desativado"
                                    ? "bg-red-100 text-red-800"
                                    : statusLDAP[item.usuario.cpRF] ===
                                      "Bloqueado"
                                    ? "bg-orange-100 text-orange-800"
                                    : statusLDAP[item.usuario.cpRF] === "Erro"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {statusLDAP[item.usuario.cpRF] ||
                                  "Verificando..."}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  abrirTicketsEmLote(
                                    [item.usuario],
                                    "transferidos"
                                  )
                                }
                              >
                                Abrir Ticket
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensagem quando não há resultados */}
          {resultado.exonerados.length === 0 &&
            resultado.transferidos.length === 0 && (
              <Alert>
                <AlertDescription>
                  Nenhuma diferença encontrada entre as tabelas dos meses
                  selecionados.
                </AlertDescription>
              </Alert>
            )}
        </div>
      )}
    </div>
  );
}
