"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Permissao } from "@prisma/client";

interface Usuario {
  id: number;
  username: string;
  nome: string;
  email?: string;
  ativo: boolean;
  admin: boolean;
  data_criacao: string;
  ultimo_login?: string;
  permissoes: { permissao: Permissao }[];
}

const PERMISSOES_DISPONIVEIS = [
  { value: Permissao.VISUALIZAR_TICKETS, label: "Visualizar Tickets" },
  { value: Permissao.CRIAR_TICKETS, label: "Criar Tickets" },
  { value: Permissao.EDITAR_TICKETS, label: "Editar Tickets" },
  { value: Permissao.FECHAR_TICKETS, label: "Fechar Tickets" },
  { value: Permissao.VISUALIZAR_USUARIOS, label: "Visualizar Usuários" },
  { value: Permissao.CRIAR_USUARIOS, label: "Criar Usuários" },
  { value: Permissao.EDITAR_USUARIOS, label: "Editar Usuários" },
  { value: Permissao.ADMINISTRAR_SISTEMA, label: "Administrar Sistema" },
];

export default function GerenciarUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    nome: "",
    email: "",
    admin: false,
    ativo: true,
    permissoes: [] as Permissao[],
  });

  // Carregar usuários
  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/usuarios");
      const data = await response.json();

      if (data.success) {
        setUsuarios(data.data);
      } else {
        alert(`Erro: ${data.message}`);
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

  // Salvar usuário
  const salvarUsuario = async () => {
    try {
      const url = editingUser
        ? `/api/usuarios/${editingUser.id}`
        : "/api/usuarios";
      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          editingUser
            ? "Usuário atualizado com sucesso!"
            : "Usuário criado com sucesso!"
        );
        setShowForm(false);
        setEditingUser(null);
        setFormData({
          username: "",
          nome: "",
          email: "",
          admin: false,
          ativo: true,
          permissoes: [],
        });
        carregarUsuarios();
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      alert("Erro ao salvar usuário");
    }
  };

  // Editar usuário
  const editarUsuario = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      username: usuario.username,
      nome: usuario.nome,
      email: usuario.email || "",
      admin: usuario.admin,
      ativo: usuario.ativo,
      permissoes: usuario.permissoes.map((p) => p.permissao),
    });
    setShowForm(true);
  };

  // Deletar usuário
  const deletarUsuario = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) {
      return;
    }

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Usuário deletado com sucesso!");
        carregarUsuarios();
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      alert("Erro ao deletar usuário");
    }
  };

  // Toggle permissão
  const togglePermissao = (permissao: Permissao) => {
    setFormData((prev) => ({
      ...prev,
      permissoes: prev.permissoes.includes(permissao)
        ? prev.permissoes.filter((p) => p !== permissao)
        : [...prev.permissoes, permissao],
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
        <Button onClick={() => setShowForm(true)}>Novo Usuário</Button>
      </div>

      {/* Formulário de usuário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  disabled={!!editingUser}
                />
              </div>
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nome: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.admin}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        admin: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  Administrador
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ativo: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  Ativo
                </label>
              </div>
            </div>

            <div>
              <Label>Permissões</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {PERMISSOES_DISPONIVEIS.map((permissao) => (
                  <label key={permissao.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissoes.includes(permissao.value)}
                      onChange={() => togglePermissao(permissao.value)}
                      className="mr-2"
                    />
                    {permissao.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={salvarUsuario}>
                {editingUser ? "Atualizar" : "Criar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setFormData({
                    username: "",
                    nome: "",
                    email: "",
                    admin: false,
                    ativo: true,
                    permissoes: [],
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({usuarios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-700">
                    ID
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">
                    Usuário
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">
                    Nome
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">
                    Email
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">
                    Admin
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">
                    Permissões
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">
                    Último Login
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-600">{usuario.id}</td>
                    <td className="p-3">
                      <div className="font-medium text-gray-900">
                        @{usuario.username}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-900">
                        {usuario.nome}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {usuario.email || "N/A"}
                    </td>
                    <td className="p-3">
                      <Badge variant={usuario.ativo ? "default" : "secondary"}>
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {usuario.admin ? (
                        <Badge variant="destructive">Sim</Badge>
                      ) : (
                        <span className="text-gray-400">Não</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {usuario.permissoes.slice(0, 3).map((p) => (
                          <Badge
                            key={p.permissao}
                            variant="outline"
                            className="text-xs"
                          >
                            {p.permissao.replace(/_/g, " ").substring(0, 8)}
                          </Badge>
                        ))}
                        {usuario.permissoes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{usuario.permissoes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {usuario.ultimo_login
                        ? new Date(usuario.ultimo_login).toLocaleDateString(
                            "pt-BR"
                          )
                        : "Nunca"}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editarUsuario(usuario)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletarUsuario(usuario.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Deletar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
