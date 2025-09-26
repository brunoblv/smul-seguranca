"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UsuarioSMUL {
  rf: string;
  username: string;
  nome: string;
  unidade_sigla: string;
  unidade_nome: string;
  departamento: string;
  cargo: string;
  vinculo: string;
  dias_sem_logar: number;
  ultimo_login?: string;
  status_ldap: string;
  email?: string;
}

interface Resumo {
  total_usuarios: number;
  usuarios_ativos_ldap: number;
  usuarios_inativos_ldap: number;
  usuarios_sem_login_30_dias: number;
  usuarios_sem_login_60_dias: number;
  usuarios_sem_login_90_dias: number;
}

export default function UsuariosSMUL() {
  const [usuarios, setUsuarios] = useState<UsuarioSMUL[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<UsuarioSMUL[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [filtros, setFiltros] = useState({
    busca: "",
    status_ldap: "todos",
    dias_sem_logar: "todos",
    unidade: "todos",
  });
  const [criandoTicket, setCriandoTicket] = useState<string | null>(null);

  // Carregar usuários
  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/usuarios-smul");
      const data = await response.json();

      if (data.success) {
        setUsuarios(data.usuarios);
        setUsuariosFiltrados(data.usuarios);
        setResumo(data.resumo);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      alert("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtrados = [...usuarios];

    // Filtro de busca (nome, username, RF)
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      filtrados = filtrados.filter(
        (u) =>
          u.nome.toLowerCase().includes(busca) ||
          u.username.toLowerCase().includes(busca) ||
          u.rf.toLowerCase().includes(busca)
      );
    }

    // Filtro de status LDAP
    if (filtros.status_ldap !== "todos") {
      filtrados = filtrados.filter(
        (u) => u.status_ldap === filtros.status_ldap
      );
    }

    // Filtro de dias sem logar
    if (filtros.dias_sem_logar !== "todos") {
      const dias = parseInt(filtros.dias_sem_logar);
      filtrados = filtrados.filter((u) => u.dias_sem_logar >= dias);
    }

    // Filtro de unidade
    if (filtros.unidade !== "todos") {
      filtrados = filtrados.filter((u) => u.unidade_sigla === filtros.unidade);
    }

    setUsuariosFiltrados(filtrados);
  }, [usuarios, filtros]);

  // Criar ticket
  const criarTicket = async (usuario: UsuarioSMUL) => {
    try {
      setCriandoTicket(usuario.username);

      const response = await fetch("/api/tickets/criar-individual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usuario.username,
          nome: usuario.nome,
          email: usuario.email,
          departamento: usuario.departamento,
          observacoes: `Usuário sem login há ${usuario.dias_sem_logar} dias (RF: ${usuario.rf})`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Ticket criado com sucesso! ID: ${data.ticket.id}`);
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
      alert("Erro ao criar ticket");
    } finally {
      setCriandoTicket(null);
    }
  };

  // Obter cor do badge baseado no status LDAP
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ATIVO":
        return "default";
      case "BLOQUEADO":
        return "destructive";
      case "DESATIVO":
        return "secondary";
      case "NAO_ENCONTRADO":
        return "outline";
      default:
        return "outline";
    }
  };

  // Obter cor do badge baseado nos dias sem logar
  const getDiasBadgeVariant = (dias: number) => {
    if (dias >= 90) return "destructive";
    if (dias >= 60) return "secondary";
    if (dias >= 30) return "outline";
    return "default";
  };

  // Obter unidades únicas para o filtro
  const unidades = [...new Set(usuarios.map((u) => u.unidade_sigla))]
    .filter(Boolean)
    .sort();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando usuários do SMUL...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Usuários do SMUL</h1>
        <Button onClick={carregarUsuarios} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{resumo.total_usuarios}</div>
              <div className="text-sm text-gray-600">Total de Usuários</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {resumo.usuarios_ativos_ldap}
              </div>
              <div className="text-sm text-gray-600">Ativos no LDAP</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {resumo.usuarios_inativos_ldap}
              </div>
              <div className="text-sm text-gray-600">Inativos no LDAP</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {resumo.usuarios_sem_login_30_dias}
              </div>
              <div className="text-sm text-gray-600">Sem login ≥30 dias</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {resumo.usuarios_sem_login_60_dias}
              </div>
              <div className="text-sm text-gray-600">Sem login ≥60 dias</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-800">
                {resumo.usuarios_sem_login_90_dias}
              </div>
              <div className="text-sm text-gray-600">Sem login ≥90 dias</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Nome, usuário ou RF..."
                value={filtros.busca}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, busca: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status LDAP</label>
              <Select
                value={filtros.status_ldap}
                onValueChange={(value) =>
                  setFiltros((prev) => ({ ...prev, status_ldap: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                  <SelectItem value="DESATIVO">Desativo</SelectItem>
                  <SelectItem value="NAO_ENCONTRADO">Não Encontrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Dias sem Logar</label>
              <Select
                value={filtros.dias_sem_logar}
                onValueChange={(value) =>
                  setFiltros((prev) => ({ ...prev, dias_sem_logar: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="30">≥30 dias</SelectItem>
                  <SelectItem value="60">≥60 dias</SelectItem>
                  <SelectItem value="90">≥90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Unidade</label>
              <Select
                value={filtros.unidade}
                onValueChange={(value) =>
                  setFiltros((prev) => ({ ...prev, unidade: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade} value={unidade}>
                      {unidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>
            Usuários ({usuariosFiltrados.length} de {usuarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RF</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status LDAP</TableHead>
                  <TableHead>Dias sem Logar</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados.map((usuario) => (
                  <TableRow key={usuario.username}>
                    <TableCell className="font-mono text-sm">
                      {usuario.rf}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {usuario.username}
                    </TableCell>
                    <TableCell className="font-medium">
                      {usuario.nome}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {usuario.unidade_sigla}
                        </div>
                        <div className="text-xs text-gray-500">
                          {usuario.unidade_nome}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {usuario.departamento}
                    </TableCell>
                    <TableCell className="text-sm">{usuario.cargo}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(usuario.status_ldap)}
                      >
                        {usuario.status_ldap}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getDiasBadgeVariant(usuario.dias_sem_logar)}
                      >
                        {usuario.dias_sem_logar === 999
                          ? "Nunca"
                          : `${usuario.dias_sem_logar} dias`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {usuario.ultimo_login
                        ? new Date(usuario.ultimo_login).toLocaleDateString(
                            "pt-BR"
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => criarTicket(usuario)}
                        disabled={criandoTicket === usuario.username}
                        className="text-xs"
                      >
                        {criandoTicket === usuario.username
                          ? "Criando..."
                          : "Abrir Ticket"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
