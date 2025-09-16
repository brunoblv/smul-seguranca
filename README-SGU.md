# Integração com Banco SGU

## Visão Geral

O sistema agora integra com o banco de dados SGU para buscar o departamento real dos usuários (campo `cpnomesetor2` da tabela `tblUsuarios`) e exibir junto com o departamento do LDAP.

## Estrutura da Tabela tblUsuarios

### Campos Principais:
- **cpID**: ID único (AUTO_INCREMENT)
- **cpRF**: RF do usuário (7 caracteres)
- **cpUsuarioRede**: Usuário de rede (8 caracteres) - **CAMPO CHAVE**
- **cpNome**: Nome completo (250 caracteres)
- **cpNomeSocial**: Nome social (250 caracteres)
- **cpVinculo**: Vínculo (1 caractere)
- **cpnomecargo2**: Nome do cargo (150 caracteres)
- **cpRef**: Referência (6 caracteres)
- **cpUnid**: Unidade (15 caracteres)
- **cpnomesetor2**: Nome do setor/departamento (250 caracteres) - **CAMPO USADO**
- **cpPermissao**: Permissão (3 caracteres)
- **cpImprimir**: Permissão de impressão (5 caracteres)
- **cpUltimaCarga**: Última carga (3 caracteres)
- **cpOBS**: Observações (300 caracteres)

## Configuração

### Variáveis de Ambiente (.env):
```env
SGU_DB_HOST="10.75.32.125"
SGU_DB_USR="root"
SGU_DB_PASS="Hta123P"
SGU_DB_NAME="SGU"
```

### Conexão:
- **Servidor**: MySQL
- **Driver**: mysql2
- **Porta**: 3306
- **Pool de Conexões**: Configurado para até 10 conexões simultâneas
- **Timeout**: 30 segundos de idle

## Funcionamento

### 1. Busca de Usuários Inativos
1. Sistema busca usuários inativos no Active Directory
2. Para cada usuário encontrado, executa query no SGU:
   ```sql
   SELECT cpnomesetor2 
   FROM tblUsuarios 
   WHERE cpUsuarioRede = @username
   ```
3. Exibe tanto o departamento do LDAP quanto o do SGU

### 2. Busca de Computadores Inativos
1. Sistema busca computadores inativos no Active Directory
2. Para cada computador com usuário responsável, busca o departamento SGU do usuário
3. Exibe o departamento do computador (LDAP) e o departamento do usuário responsável (SGU)

### 3. Otimizações
- **Busca em Lote**: Para múltiplos usuários, executa uma única query com `IN`
- **Cache de Conexão**: Pool de conexões reutilizado
- **Tratamento de Erros**: Sistema continua funcionando mesmo se SGU estiver indisponível

## Exemplos de Uso

### Interface de Usuários:
```
João Silva (joao.silva)
TI • Sem departamento (SGU: Secretaria Municipal de Tecnologia)
joao.silva@prefeitura.sp.gov.br
```

### Interface de Computadores:
```
Departamento: TI
SGU: Secretaria Municipal de Tecnologia
```

### Exportação CSV:
```csv
username,displayName,email,department,departmentSgu,lastLogon,daysInactive,ou,server
joao.silva,João Silva,joao.silva@prefeitura.sp.gov.br,TI,Secretaria Municipal de Tecnologia,2024-01-15,30,OU=Usuarios,ldap://10.10.53.10
```

## Arquivos Modificados

### Novos Arquivos:
- `src/lib/sgu-database.ts` - Módulo de conexão com SGU

### Arquivos Atualizados:
- `prisma/schema.prisma` - Adicionado campo `departamento_sgu`
- `src/lib/database.ts` - Funções de banco atualizadas
- `src/app/api/ldap/inactive-users/route.ts` - Integração SGU
- `src/app/api/ldap/inactive-computers/route.ts` - Integração SGU
- `src/app/usuarios-inativos/page.tsx` - Interface atualizada
- `src/app/computadores-inativos/page.tsx` - Interface atualizada

## Troubleshooting

### Erro de Conexão:
```
Erro ao conectar ao banco SGU: ECONNREFUSED
```
**Solução**: Verificar se o servidor SGU está acessível e as credenciais estão corretas.

### Usuário Não Encontrado:
- Verificar se o `cpUsuarioRede` no SGU corresponde ao `sAMAccountName` do LDAP
- Verificar se o usuário existe na tabela `tblUsuarios`

### Performance:
- Sistema usa pool de conexões para otimizar performance
- Busca em lote reduz número de queries ao banco
- Timeout configurado para evitar travamentos

## Logs

O sistema registra logs detalhados:
```
Conectado ao banco SGU com sucesso
Departamentos SGU carregados para 15 usuários
Erro ao buscar departamentos SGU: [detalhes do erro]
```

## Dependências

- `mysql2`: Driver para MySQL
