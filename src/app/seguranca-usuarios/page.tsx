"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Trash,
  AlertCircle,
} from "lucide-react";

interface UsuarioSeguranca {
  id: number;
  login: string;
  nome: string;
  cargo?: string;
  unidade?: string;
  email?: string;
  status_ldap: string;
  departamento_ldap?: string;
  data_verificacao: string;
}

interface VerificacaoData {
  total_usuarios: number;
  nao_encontrados: number;
  encontrados: number;
  usuarios_nao_encontrados: UsuarioSeguranca[];
  usuarios_encontrados: UsuarioSeguranca[];
  data_verificacao: string;
}

export default function SegurancaUsuariosPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VerificacaoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyNaoEncontrados, setShowOnlyNaoEncontrados] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingBatch, setDeletingBatch] = useState(false);

  const verificarUsuarios = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/seguranca/usuarios-nao-ldap");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Erro ao verificar usuários");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor");
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  const excluirUsuario = async (userId: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) {
      return;
    }

    setDeleting(userId);
    try {
      const response = await fetch(
        `/api/seguranca/excluir-usuario?id=${userId}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();

      if (result.success) {
        // Remover usuário da lista local
        if (data) {
          const updatedData = { ...data };
          if (showOnlyNaoEncontrados) {
            updatedData.usuarios_nao_encontrados =
              updatedData.usuarios_nao_encontrados.filter(
                (u) => u.id !== userId
              );
            updatedData.nao_encontrados =
              updatedData.usuarios_nao_encontrados.length;
          } else {
            updatedData.usuarios_encontrados =
              updatedData.usuarios_encontrados.filter((u) => u.id !== userId);
            updatedData.encontrados = updatedData.usuarios_encontrados.length;
          }
          updatedData.total_usuarios =
            updatedData.nao_encontrados + updatedData.encontrados;
          setData(updatedData);
        }
        alert(`Usuário "${nome}" excluído com sucesso!`);
      } else {
        alert(`Erro ao excluir usuário: ${result.message}`);
      }
    } catch (err) {
      alert("Erro de conexão com o servidor");
      console.error("Erro:", err);
    } finally {
      setDeleting(null);
    }
  };

  const excluirLote = async () => {
    if (selectedUsers.length === 0) {
      alert("Selecione pelo menos um usuário para excluir");
      return;
    }

    if (
      !confirm(
        `Tem certeza que deseja excluir ${selectedUsers.length} usuário(s)?`
      )
    ) {
      return;
    }

    setDeletingBatch(true);
    try {
      const response = await fetch("/api/seguranca/excluir-lote", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });
      const result = await response.json();

      if (result.success) {
        // Remover usuários da lista local
        if (data) {
          const updatedData = { ...data };
          if (showOnlyNaoEncontrados) {
            updatedData.usuarios_nao_encontrados =
              updatedData.usuarios_nao_encontrados.filter(
                (u) => !selectedUsers.includes(u.id)
              );
            updatedData.nao_encontrados =
              updatedData.usuarios_nao_encontrados.length;
          } else {
            updatedData.usuarios_encontrados =
              updatedData.usuarios_encontrados.filter(
                (u) => !selectedUsers.includes(u.id)
              );
            updatedData.encontrados = updatedData.usuarios_encontrados.length;
          }
          updatedData.total_usuarios =
            updatedData.nao_encontrados + updatedData.encontrados;
          setData(updatedData);
        }
        setSelectedUsers([]);
        alert(
          `${result.data.total_excluidos} usuário(s) excluído(s) com sucesso!`
        );
      } else {
        alert(`Erro ao excluir usuários: ${result.message}`);
      }
    } catch (err) {
      alert("Erro de conexão com o servidor");
      console.error("Erro:", err);
    } finally {
      setDeletingBatch(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const currentUsers = showOnlyNaoEncontrados
      ? data?.usuarios_nao_encontrados || []
      : data?.usuarios_encontrados || [];

    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map((u) => u.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NAO_ENCONTRADO":
        return <Badge variant="destructive">Não Encontrado</Badge>;
      case "ATIVO":
        return <Badge variant="default">Ativo</Badge>;
      case "BLOQUEADO":
        return <Badge variant="secondary">Bloqueado</Badge>;
      case "DESATIVO":
        return <Badge variant="outline">Desativado</Badge>;
      case "ERRO_VERIFICACAO":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const usuariosParaExibir = showOnlyNaoEncontrados
    ? data?.usuarios_nao_encontrados || []
    : data?.usuarios_encontrados || [];

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Verificando permissões...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Segurança de Usuários</h1>
          <p className="text-muted-foreground">
            Verificação de usuários do sistema de assinatura que não foram
            encontrados no LDAP
          </p>
        </div>
        <Button
          onClick={verificarUsuarios}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Verificando..." : "Verificar Usuários"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          {/* Alerta de Segurança */}
          {showOnlyNaoEncontrados && data.nao_encontrados > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> {data.nao_encontrados} usuário(s) não
                foram encontrados no LDAP. Estes usuários podem ser excluídos do
                sistema de assinatura se não forem mais necessários.
              </AlertDescription>
            </Alert>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Usuários
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.total_usuarios}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Não Encontrados
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {data.nao_encontrados}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Encontrados
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.encontrados}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Última Verificação
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {formatDate(data.data_verificacao)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Ações</CardTitle>
              <CardDescription>
                Escolha quais usuários exibir e execute ações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filtros */}
                <div className="flex gap-4">
                  <Button
                    variant={showOnlyNaoEncontrados ? "default" : "outline"}
                    onClick={() => {
                      setShowOnlyNaoEncontrados(true);
                      setSelectedUsers([]);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Não Encontrados ({data.nao_encontrados})
                  </Button>
                  <Button
                    variant={!showOnlyNaoEncontrados ? "default" : "outline"}
                    onClick={() => {
                      setShowOnlyNaoEncontrados(false);
                      setSelectedUsers([]);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Encontrados ({data.encontrados})
                  </Button>
                </div>

                {/* Ações de Exclusão - apenas para usuários não encontrados e administradores */}
                {showOnlyNaoEncontrados &&
                  data.nao_encontrados > 0 &&
                  isAdmin && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="outline"
                            onClick={selectAllUsers}
                            disabled={usuariosParaExibir.length === 0}
                          >
                            {selectedUsers.length === usuariosParaExibir.length
                              ? "Desmarcar Todos"
                              : "Selecionar Todos"}
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {selectedUsers.length} de{" "}
                            {usuariosParaExibir.length} selecionados
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            onClick={excluirLote}
                            disabled={
                              selectedUsers.length === 0 || deletingBatch
                            }
                          >
                            {deletingBatch ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4 mr-2" />
                            )}
                            {deletingBatch
                              ? "Excluindo..."
                              : `Excluir Selecionados (${selectedUsers.length})`}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Aviso para usuários não-admin */}
                {showOnlyNaoEncontrados &&
                  data.nao_encontrados > 0 &&
                  !isAdmin && (
                    <div className="border-t pt-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Informação:</strong> Apenas administradores
                          podem excluir usuários. Entre em contato com um
                          administrador para remover usuários não encontrados no
                          LDAP.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>
                {showOnlyNaoEncontrados
                  ? "Usuários Não Encontrados no LDAP"
                  : "Usuários Encontrados no LDAP"}
              </CardTitle>
              <CardDescription>
                {usuariosParaExibir.length} usuários encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {showOnlyNaoEncontrados && isAdmin && (
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={
                              selectedUsers.length ===
                                usuariosParaExibir.length &&
                              usuariosParaExibir.length > 0
                            }
                            onChange={selectAllUsers}
                            className="rounded"
                          />
                        </TableHead>
                      )}
                      <TableHead>Login</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status LDAP</TableHead>
                      {!showOnlyNaoEncontrados && (
                        <TableHead>Departamento LDAP</TableHead>
                      )}
                      {showOnlyNaoEncontrados && isAdmin && (
                        <TableHead className="w-20">Ações</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuariosParaExibir.map((usuario) => (
                      <TableRow key={usuario.id}>
                        {showOnlyNaoEncontrados && isAdmin && (
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(usuario.id)}
                              onChange={() => toggleUserSelection(usuario.id)}
                              className="rounded"
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          {usuario.login}
                        </TableCell>
                        <TableCell>{usuario.nome}</TableCell>
                        <TableCell>{usuario.cargo || "-"}</TableCell>
                        <TableCell>{usuario.unidade || "-"}</TableCell>
                        <TableCell>{usuario.email || "-"}</TableCell>
                        <TableCell>
                          {getStatusBadge(usuario.status_ldap)}
                        </TableCell>
                        {!showOnlyNaoEncontrados && (
                          <TableCell>
                            {usuario.departamento_ldap || "-"}
                          </TableCell>
                        )}
                        {showOnlyNaoEncontrados && isAdmin && (
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                excluirUsuario(usuario.id, usuario.nome)
                              }
                              disabled={deleting === usuario.id}
                            >
                              {deleting === usuario.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!data && !loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma verificação realizada
              </h3>
              <p className="text-muted-foreground mb-4">
                Clique em "Verificar Usuários" para iniciar a análise de
                segurança
              </p>
              <Button onClick={verificarUsuarios}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Usuários
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
