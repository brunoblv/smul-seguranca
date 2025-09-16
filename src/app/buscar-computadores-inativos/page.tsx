"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Monitor,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ResultadoBusca {
  nomeComputador: string;
  status: string;
  error?: string;
}

export default function BuscarComputadoresInativosPage() {
  const [formData, setFormData] = useState({
    daysInactive: "30",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    message: string;
    total: number;
    sucessos: number;
    erros: number;
    resultados: ResultadoBusca[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResultado(null);

    try {
      const response = await fetch("/api/ldap/inactive-computers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          daysInactive: parseInt(formData.daysInactive),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar computadores inativos");
      }

      setResultado(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
          <Monitor className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Buscar Computadores Inativos
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Identifique computadores que não fazem login há mais de X dias no
          Active Directory configurado
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Configurações da Busca
          </CardTitle>
          <CardDescription>
            Configure quantos dias de inatividade para buscar computadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Dias Inativos
              </label>
              <Input
                name="daysInactive"
                type="number"
                value={formData.daysInactive}
                onChange={handleInputChange}
                placeholder="30"
                min="1"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Buscar computadores que não fazem login há mais de X dias
              </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Computadores Inativos
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Resultado */}
      {error && (
        <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Erro</span>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
          </CardContent>
        </Card>
      )}

      {resultado && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resultado da Busca
            </CardTitle>
            <CardDescription>{resultado.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {resultado.total}
                </div>
                <div className="text-sm text-blue-800">Total Encontrados</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {resultado.sucessos}
                </div>
                <div className="text-sm text-green-800">Salvos com Sucesso</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {resultado.erros}
                </div>
                <div className="text-sm text-red-800">Erros</div>
              </div>
            </div>

            {resultado.resultados.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">
                  Detalhes dos Resultados:
                </h4>
                <div className="max-h-96 overflow-y-auto">
                  {resultado.resultados.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        item.status === "salvo"
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.status === "salvo" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          {item.nomeComputador}
                        </span>
                      </div>
                      <div className="text-sm">
                        {item.status === "salvo" ? (
                          <span className="text-green-600">Salvo</span>
                        ) : (
                          <span className="text-red-600">
                            Erro: {item.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações adicionais */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            • A busca procura por objetos do tipo "computer" no Active Directory
          </p>
          <p>• Computadores desabilitados são excluídos da busca</p>
          <p>
            • O sistema verifica tanto "lastLogonTimestamp" quanto "lastLogon"
          </p>
          <p>• Computadores encontrados são salvos com status "PENDENTE"</p>
          <p>• Usa as configurações LDAP padrão do sistema</p>
        </CardContent>
      </Card>
    </div>
  );
}
