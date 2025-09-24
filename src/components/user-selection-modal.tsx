"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Building, CheckCircle } from "lucide-react";

interface UserResult {
  exists: boolean;
  username?: string;
  email?: string;
  displayName?: string;
  department?: string;
  userAccountControl?: string;
  lockoutTime?: string;
  lastLogonTimestamp?: string;
  lastLogon?: string;
  error?: string;
}

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserResult[];
  onSelectUser: (user: UserResult) => void;
  searchValue: string;
}

export function UserSelectionModal({
  isOpen,
  onClose,
  users,
  onSelectUser,
  searchValue,
}: UserSelectionModalProps) {
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

  console.log("UserSelectionModal render:", { isOpen, usersCount: users.length });

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user);
  };

  const handleConfirmSelection = () => {
    if (selectedUser) {
      onSelectUser(selectedUser);
      setSelectedUser(null);
      onClose();
    }
  };

  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return "Nunca";
    try {
      const date = new Date(parseInt(timestamp) / 10000 - 11644473600000);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return "Nunca";
    }
  };

  const getStatusBadge = (user: UserResult) => {
    if (user.userAccountControl) {
      const uac = parseInt(user.userAccountControl);
      if (uac & 0x2) {
        return <Badge variant="destructive">Desabilitado</Badge>;
      }
      if (uac & 0x10) {
        return <Badge variant="secondary">Bloqueado</Badge>;
      }
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Múltiplos usuários encontrados</DialogTitle>
          <DialogDescription>
            Encontramos {users.length} usuário(s) para "{searchValue}". 
            Selecione o usuário correto:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {users.map((user, index) => (
            <div
              key={user.username || index}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedUser?.username === user.username
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleSelectUser(user)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {user.displayName || "Nome não disponível"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Usuário: {user.username}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {user.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{user.email}</span>
                      </div>
                    )}

                    {user.department && (
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{user.department}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Último login:</span>
                      <span className="text-gray-600">
                        {formatDate(user.lastLogonTimestamp)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Status:</span>
                      {getStatusBadge(user)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  {selectedUser?.username === user.username && (
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedUser}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Selecionar Usuário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
