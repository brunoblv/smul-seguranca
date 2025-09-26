# Página de Usuários SMUL

## Visão Geral

A página de Usuários SMUL é uma funcionalidade administrativa que permite visualizar todos os usuários cadastrados no sistema SGU da Secretaria Municipal de Urbanismo e Licenciamento (SMUL), com informações integradas do Active Directory (LDAP).

## Funcionalidades

### 1. Visualização Completa de Usuários
- **RF**: Registro Funcional do usuário
- **Usuário de Rede**: Username do Active Directory
- **Nome**: Nome completo do usuário
- **Unidade**: Sigla e nome da unidade organizacional
- **Departamento**: Setor/departamento do usuário
- **Cargo**: Cargo/função do usuário
- **Status LDAP**: Status do usuário no Active Directory
- **Dias sem Logar**: Quantos dias o usuário não fez login na rede
- **Último Login**: Data do último login (quando disponível)

### 2. Sistema de Filtros
- **Busca**: Por nome, username ou RF
- **Status LDAP**: Filtrar por status no Active Directory
- **Dias sem Logar**: Filtrar usuários inativos por período
- **Unidade**: Filtrar por unidade organizacional

### 3. Resumo Estatístico
- Total de usuários
- Usuários ativos no LDAP
- Usuários inativos no LDAP
- Usuários sem login há 30, 60 e 90 dias

### 4. Criação de Tickets
- Botão "Abrir Ticket" para cada usuário
- Criação automática de tickets para usuários inativos
- Integração com o sistema de tickets existente

## Acesso

Esta funcionalidade está disponível apenas para usuários com permissão de administrador.

## APIs Utilizadas

### GET /api/usuarios-smul
Busca todos os usuários do SMUL com informações do SGU e LDAP.

**Resposta:**
```json
{
  "success": true,
  "usuarios": [
    {
      "rf": "1234567",
      "username": "D123456",
      "nome": "João Silva",
      "unidade_sigla": "TI",
      "unidade_nome": "Tecnologia da Informação",
      "departamento": "Desenvolvimento",
      "cargo": "Analista",
      "vinculo": "E",
      "dias_sem_logar": 15,
      "ultimo_login": "2024-01-15T10:30:00Z",
      "status_ldap": "ATIVO",
      "email": "joao.silva@smul.sp.gov.br"
    }
  ],
  "total": 1500,
  "resumo": {
    "total_usuarios": 1500,
    "usuarios_ativos_ldap": 1200,
    "usuarios_inativos_ldap": 300,
    "usuarios_sem_login_30_dias": 200,
    "usuarios_sem_login_60_dias": 100,
    "usuarios_sem_login_90_dias": 50
  }
}
```

### POST /api/tickets/criar-individual
Cria um ticket individual para um usuário específico.

**Parâmetros:**
```json
{
  "username": "D123456",
  "nome": "João Silva",
  "email": "joao.silva@smul.sp.gov.br",
  "departamento": "Desenvolvimento",
  "observacoes": "Usuário sem login há 15 dias"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Ticket criado com sucesso",
  "ticket": {
    "id": 123,
    "username": "D123456",
    "nome": "João Silva",
    "status": "PENDENTE",
    "dataCriacao": "2024-01-30T10:30:00Z"
  }
}
```

## Integração com Bancos de Dados

### Banco SGU
- **Tabela**: `tblUsuarios`
- **Campos utilizados**:
  - `cpRF`: Registro Funcional
  - `cpUsuarioRede`: Username do Active Directory
  - `cpNome`: Nome completo
  - `cpNomeSocial`: Nome social
  - `cpnomesetor2`: Departamento
  - `cpnomecargo2`: Cargo
  - `cpVinculo`: Vínculo
  - `cpUnid`: Unidade organizacional

### Banco de Unidades
- **Tabela**: `tblUnidades`
- **Campos utilizados**:
  - `uid`: ID da unidade
  - `sigla`: Sigla da unidade
  - `nome`: Nome da unidade

### Active Directory (LDAP)
- **Atributos consultados**:
  - `sAMAccountName`: Username
  - `displayName`: Nome de exibição
  - `mail`: Email
  - `lastLogonTimestamp`: Último login
  - `userAccountControl`: Status da conta

## Performance

- **Processamento em lotes**: Usuários são processados em lotes de 50 para não sobrecarregar o LDAP
- **Cache**: Informações do SGU são buscadas uma única vez
- **Filtros otimizados**: Filtros são aplicados no frontend para melhor performance

## Segurança

- **Autenticação**: Requer login de usuário
- **Autorização**: Apenas administradores podem acessar
- **Validação**: Dados são validados antes de criar tickets
- **Logs**: Todas as operações são logadas para auditoria

## Monitoramento

- **Logs detalhados**: Cada etapa do processamento é logada
- **Métricas**: Contadores de usuários processados
- **Tratamento de erros**: Erros são capturados e tratados adequadamente
- **Timeouts**: Configurados para evitar travamentos

## Manutenção

### Atualização de Dados
- Os dados são buscados em tempo real do SGU e LDAP
- Não há cache persistente, garantindo dados sempre atualizados

### Troubleshooting
- Verificar logs do servidor para erros de conexão
- Validar configurações de banco de dados SGU
- Verificar conectividade com servidores LDAP
- Monitorar performance durante picos de uso

## Próximas Melhorias

1. **Exportação**: Adicionar funcionalidade de exportar dados para Excel/CSV
2. **Paginação**: Implementar paginação para grandes volumes de dados
3. **Relatórios**: Gerar relatórios automáticos de usuários inativos
4. **Notificações**: Alertas automáticos para usuários muito inativos
5. **Histórico**: Manter histórico de alterações de status
