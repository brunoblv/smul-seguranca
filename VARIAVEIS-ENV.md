# Variáveis de Ambiente Necessárias

## Arquivo .env

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# ===========================================
# CONFIGURAÇÕES DO SISTEMA DE SEGURANÇA SMUL
# ===========================================

# ===========================================
# CONFIGURAÇÕES DO BANCO SGU - MySQL
# ===========================================
# Servidor SGU (IP ou hostname)
SGU_DB_HOST="10.75.32.125"

# Porta do banco (MySQL padrão é 3306)
SGU_DB_PORT="3306"

# Nome do banco de dados
SGU_DB_NAME="SGU"

# Usuário do banco
SGU_DB_USR="root"

# Senha do banco
SGU_DB_PASS="Hta123P"

# ===========================================
# CONFIGURAÇÕES DO SERVIDOR LDAP - Active Directory
# ===========================================
# Servidor LDAP (IP ou hostname)
LDAP_SERVER="ldap://10.10.65.242"

# Domínio (formato @dominio.com)
LDAP_DOMAIN="@rede.sp"

# Base DN (formato DC=dominio,DC=com)
LDAP_BASE="DC=rede,DC=sp"

# Usuário para autenticação
LDAP_USER="usr_smdu_freenas"

# Senha do usuário
LDAP_PASS="Prodam01"

# ===========================================
# CONFIGURAÇÕES DA APLICAÇÃO
# ===========================================
# URL base da aplicação (para links e redirecionamentos)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# ===========================================
# CONFIGURAÇÕES DO PRISMA (SQLite)
# ===========================================
# O Prisma está configurado para usar SQLite local
# Não requer configurações adicionais no .env
```

## Variáveis por Categoria

### 1. Banco SGU (MySQL)
- `SGU_DB_HOST`: Servidor do banco SGU
- `SGU_DB_PORT`: Porta do MySQL (padrão: 3306)
- `SGU_DB_NAME`: Nome do banco de dados
- `SGU_DB_USR`: Usuário do banco
- `SGU_DB_PASS`: Senha do banco

### 2. Servidor LDAP (Active Directory)
- `LDAP_SERVER`: URL do servidor LDAP
- `LDAP_DOMAIN`: Domínio para autenticação
- `LDAP_BASE`: Base DN para buscas
- `LDAP_USER`: Usuário para autenticação
- `LDAP_PASS`: Senha do usuário

### 3. Aplicação
- `NEXT_PUBLIC_BASE_URL`: URL base da aplicação

### 4. Prisma (SQLite)
- Não requer variáveis de ambiente (usa arquivo local)

## Observações

1. **Segurança**: Nunca commite o arquivo `.env` no repositório
2. **Desenvolvimento**: Use valores de desenvolvimento/teste
3. **Produção**: Use valores específicos do ambiente de produção
4. **Backup**: Mantenha backup seguro das configurações de produção
