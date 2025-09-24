"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UnidadeOrganizacional {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  ordem: number;
}

export default function GerenciarOUs() {
  const { isAdmin, loading } = useAuth();
  const [ous, setOus] = useState<UnidadeOrganizacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingOU, setEditingOU] = useState<UnidadeOrganizacional | null>(
    null
  );
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    descricao: "",
    ativo: true,
    ordem: 0,
  });

  // Carregar OUs
  useEffect(() => {
    loadOUs();
  }, []);

  const loadOUs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/unidades-organizacionais");
      const data = await response.json();
      if (data.success) {
        setOus(data.unidades);
      }
    } catch (error) {
      console.error("Erro ao carregar OUs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingOU(null);
    setFormData({
      codigo: "",
      nome: "",
      descricao: "",
      ativo: true,
      ordem: ous.length + 1,
    });
    setShowDialog(true);
  };

  const handleEdit = (ou: UnidadeOrganizacional) => {
    setEditingOU(ou);
    setFormData({
      codigo: ou.codigo,
      nome: ou.nome,
      descricao: ou.descricao || "",
      ativo: ou.ativo,
      ordem: ou.ordem,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingOU) {
        // Atualizar
        const response = await fetch(
          `/api/unidades-organizacionais/${editingOU.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );
        const data = await response.json();
        if (data.success) {
          await loadOUs();
          setShowDialog(false);
        }
      } else {
        // Criar
        const response = await fetch("/api/unidades-organizacionais", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (data.success) {
          await loadOUs();
          setShowDialog(false);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar OU:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta OU?")) {
      try {
        const response = await fetch(`/api/unidades-organizacionais/${id}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (data.success) {
          await loadOUs();
        }
      } catch (error) {
        console.error("Erro ao excluir OU:", error);
      }
    }
  };

  const filteredOUs = ous.filter(
    (ou) =>
      ou.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ou.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ou.descricao &&
        ou.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Gerenciar Unidades Organizacionais
          </h1>
          <p className="text-slate-600">
            Gerencie as unidades organizacionais do sistema
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Unidades Organizacionais
                </CardTitle>
                <CardDescription>
                  {ous.length} unidades cadastradas
                </CardDescription>
              </div>
              <Button onClick={handleCreate} className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Nova OU
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por código, nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredOUs.map((ou) => (
                <div
                  key={ou.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">
                        {ou.codigo}
                      </span>
                      <Badge variant={ou.ativo ? "default" : "secondary"}>
                        {ou.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">
                      {ou.nome}
                    </p>
                    {ou.descricao && (
                      <p className="text-xs text-slate-500 mt-1">
                        {ou.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ou)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ou.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dialog para criar/editar OU */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingOU ? "Editar OU" : "Nova OU"}</DialogTitle>
              <DialogDescription>
                {editingOU
                  ? "Edite as informações da unidade organizacional"
                  : "Preencha as informações da nova unidade organizacional"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                  placeholder="Ex: PRODAM"
                />
              </div>

              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Empresa de Tecnologia da Informação"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Descrição opcional"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="ativo">Ativa</Label>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativo: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="ordem">Ordem</Label>
                <Input
                  id="ordem"
                  type="number"
                  value={formData.ordem}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ordem: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Ordem de exibição"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingOU ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
