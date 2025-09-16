# Migração do SQLite para MySQL

## Passos para migrar o banco de dados

### 1. Configurar o MySQL

1. **Instalar MySQL** (se não estiver instalado)
2. **Criar o banco de dados**:
   ```sql
   CREATE DATABASE seguranca_smul CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### 2. Configurar as variáveis de ambiente

1. **Copiar o arquivo de exemplo**:
   ```bash
   cp env-example .env
   ```

2. **Editar o arquivo `.env`** e configurar:
   ```env
   DATABASE_URL="mysql://usuario:senha@localhost:3306/seguranca_smul"
   ```

### 3. Executar as migrações

1. **Gerar o cliente Prisma**:
   ```bash
   npx prisma generate
   ```

2. **Criar as tabelas no MySQL**:
   ```bash
   npx prisma db push
   ```

3. **Ou usar migrações** (recomendado para produção):
   ```bash
   npx prisma migrate dev --name init
   ```

### 4. Migrar os dados (se necessário)

Se você tem dados no SQLite que precisam ser migrados:

1. **Exportar dados do SQLite**:
   ```bash
   # Criar um script de exportação
   npx prisma db seed
   ```

2. **Importar para MySQL**:
   - Os dados serão criados automaticamente pelo seed

### 5. Verificar a migração

1. **Verificar conexão**:
   ```bash
   npx prisma db pull
   ```

2. **Visualizar dados**:
   ```bash
   npx prisma studio
   ```

## Diferenças entre SQLite e MySQL

### Vantagens do MySQL:
- ✅ Melhor performance para grandes volumes
- ✅ Suporte a múltiplas conexões simultâneas
- ✅ Recursos avançados de banco de dados
- ✅ Melhor para ambientes de produção

### Considerações:
- ⚠️ Requer servidor MySQL rodando
- ⚠️ Configuração mais complexa
- ⚠️ Backup e manutenção diferentes

## Troubleshooting

### Erro de conexão:
- Verificar se o MySQL está rodando
- Verificar credenciais no `.env`
- Verificar se o banco `seguranca_smul` existe

### Erro de permissão:
- Verificar se o usuário tem permissões no banco
- Verificar se o banco existe

### Erro de charset:
- Usar `utf8mb4` para suporte completo a Unicode
