# Sistema de Consulta LDAP - Segurança SMUL

Este sistema permite consultar usuários em um diretório LDAP de duas formas:
1. **Consulta Individual**: Pesquisa um usuário específico
2. **Consulta em Lote**: Processa múltiplos usuários através de upload de arquivo CSV

## 🚀 Funcionalidades

### Consulta Individual
- Busca por nome de usuário (sAMAccountName)
- Busca por e-mail (mail)
- Busca por nome completo (displayName/cn)
- Exibe informações detalhadas do usuário encontrado
- Interface intuitiva e responsiva

### Consulta em Lote
- Upload de arquivo CSV com lista de usuários
- Processamento em lotes para otimizar performance
- Download dos resultados em formato CSV
- Limite de 100 usuários por busca para evitar sobrecarga
- Processamento paralelo com controle de taxa

## 📋 Pré-requisitos

- Node.js 18+ 
- Servidor LDAP ativo (Active Directory, OpenLDAP, etc.)
- Credenciais de acesso ao LDAP (usuário e senha)

## ⚙️ Configuração

### 1. Instalação das Dependências
```bash
npm install
```

### 2. Configuração do LDAP
Copie o arquivo `ldap-config.example` para `.env.local` e ajuste as configurações:

```bash
cp ldap-config.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:

```env
# Configuração para Active Directory (Rede SP)
LDAP_SERVER="ldap://10.10.65.242"
LDAP_DOMAIN="@rede.sp"
LDAP_BASE="DC=rede,DC=sp"
LDAP_USER="usr_smdu_freenas"
LDAP_PASS="senha"
```

### 3. Configurações Específicas por Tipo de Servidor

#### Active Directory (Windows Server) - Configuração Atual
- **LDAP_SERVER**: Endereço do controlador de domínio
- **LDAP_DOMAIN**: Domínio no formato @dominio.com
- **LDAP_BASE**: DN base no formato DC=dominio,DC=com
- **LDAP_USER**: Nome do usuário para autenticação
- **LDAP_PASS**: Senha do usuário

#### OpenLDAP
```env
LDAP_SERVER="ldap://ldap.empresa.com:389"
LDAP_DOMAIN=""
LDAP_BASE="dc=empresa,dc=com"
LDAP_USER="cn=admin,dc=empresa,dc=com"
LDAP_PASS="senha_admin"
```

## 🚀 Executando o Sistema

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

O sistema estará disponível em `http://localhost:3000`

## 📖 Como Usar

### Consulta Individual

1. Acesse a página "Consulta Individual"
2. Selecione o tipo de busca:
   - **Nome de Usuário**: Login do usuário (ex: jose.silva)
   - **E-mail**: Endereço completo (ex: jose.silva@rede.sp)
   - **Nome Completo**: Nome completo (ex: José Silva)
3. Digite o valor para busca
4. Clique em "Pesquisar Usuário"
5. Visualize o resultado

### Consulta em Lote

1. Acesse a página "Consulta em Lote"
2. Selecione o tipo de busca (usuário ou e-mail)
3. Faça upload do arquivo CSV
4. Clique em "Iniciar Busca em Lote"
5. Aguarde o processamento
6. Baixe os resultados em CSV

#### Formato do Arquivo CSV
O arquivo deve conter uma coluna chamada `username`:

```csv
username
jose.silva
maria.santos
joao.oliveira
```

## 🔧 Personalização

### Atributos LDAP
Para personalizar os atributos retornados, edite as APIs em:
- `src/app/api/ldap/search/route.ts`
- `src/app/api/ldap/batch-search/route.ts`

Atualmente configurado para Active Directory com:
```typescript
attributes: [
  "sAMAccountName", 
  "mail", 
  "displayName", 
  "cn", 
  "department", 
  "ou",
  "title",
  "telephoneNumber",
  "mobile",
  "company"
]
```

### Filtros de Busca
Para personalizar os filtros LDAP, edite a função `createLDAPFilter`:

```typescript
function createLDAPFilter(searchType: string, searchValue: string): string {
  const escapedValue = ldap.escapeFilterValue(searchValue);
  
  switch (searchType) {
    case "username":
      return `(sAMAccountName=${escapedValue})`; // Active Directory
    case "email":
      return `(mail=${escapedValue})`;
    case "displayName":
      return `(|(displayName=*${escapedValue}*)(cn=*${escapedValue}*))`;
    default:
      return `(sAMAccountName=${escapedValue})`;
  }
}
```

## 🛡️ Segurança

### Recomendações
- Use HTTPS em produção
- Configure firewalls para restringir acesso ao servidor LDAP
- Use usuários com privilégios mínimos necessários
- Considere usar autenticação de dois fatores
- Monitore logs de acesso

### Variáveis de Ambiente
- Nunca commite credenciais no código
- Use arquivos `.env.local` para desenvolvimento
- Use variáveis de ambiente do sistema em produção
- Considere usar um gerenciador de segredos

## 🐛 Troubleshooting

### Problemas Comuns

#### Erro de Conexão
```
Erro na conexão LDAP: ECONNREFUSED
```
**Solução**: Verifique se o servidor LDAP está rodando e acessível

#### Erro de Autenticação
```
Erro na autenticação LDAP: INVALID_CREDENTIALS
```
**Solução**: Verifique usuário e senha no arquivo `.env.local`

#### Erro de Base DN
```
Erro na busca LDAP: NO_SUCH_OBJECT
```
**Solução**: Verifique se o LDAP_BASE está correto

#### Timeout
```
Erro na busca LDAP: ETIMEDOUT
```
**Solução**: Ajuste os timeouts no arquivo de configuração

### Logs
O sistema registra logs detalhados no console. Para debug, verifique:
- Conexões LDAP
- Filtros de busca
- Resultados das consultas
- Erros de autenticação

## 📊 Performance

### Otimizações Implementadas
- Conexões LDAP reutilizáveis
- Processamento em lotes (máximo 5 usuários simultâneos)
- Timeouts configuráveis
- Limite de 100 usuários por busca em lote
- Pausas entre lotes para não sobrecarregar o servidor

### Monitoramento
- Tempo de resposta das consultas
- Taxa de sucesso das buscas
- Uso de memória e CPU
- Conexões simultâneas ao LDAP

## 🤝 Contribuição

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste localmente
5. Envie um pull request

## 📄 Licença

Este projeto foi desenvolvido para Segurança SMUL.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Verifique os logs do sistema
- Consulte a documentação do seu servidor LDAP
- Entre em contato com a equipe de desenvolvimento
