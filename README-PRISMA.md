# Migração para Prisma

Este projeto foi migrado de SQLite3 puro para Prisma ORM. Aqui estão as principais mudanças e como usar o novo sistema.

## Estrutura do Banco de Dados

### Schema Prisma (`prisma/schema.prisma`)

O banco de dados agora é definido através do schema do Prisma:

```prisma
model UsuarioInativo {
  id               Int      @id @default(autoincrement())
  username         String   @unique
  nome             String
  email            String?
  departamento     String?
  ultimo_login     String
  dias_inativos    Int
  status           Status   @default(PENDENTE)
  data_criacao     DateTime @default(now())
  data_atualizacao DateTime @updatedAt
  servidor_origem  String
  ou_origem        String

  @@index([username])
  @@index([status])
  @@index([dias_inativos])
  @@map("usuarios_inativos")
}

model ComputadorInativo {
  id               Int      @id @default(autoincrement())
  nome_computador  String   @unique
  ip_address       String?
  mac_address      String?
  departamento     String?
  usuario_responsavel String?
  ultimo_login     String
  dias_inativos    Int
  status           Status   @default(PENDENTE)
  data_criacao     DateTime @default(now())
  data_atualizacao DateTime @updatedAt
  servidor_origem  String
  ou_origem        String
  sistema_operacional String?
  versao_so        String?

  @@index([nome_computador])
  @@index([status])
  @@index([dias_inativos])
  @@index([ip_address])
  @@map("computadores_inativos")
}

enum Status {
  EXONERADO
  TRANSFERIDO
  LIP
  AFASTADO_PARA_OUTRO_ORGAO
  LICENCA_MEDICA
  PENDENTE
  USUARIO_CORINGA
}
```

## Comandos Disponíveis

### Desenvolvimento
```bash
# Gerar cliente Prisma
npm run db:generate

# Sincronizar schema com o banco (desenvolvimento)
npm run db:push

# Criar migração
npm run db:migrate

# Abrir Prisma Studio (interface visual)
npm run db:studio

# Executar seed com dados de exemplo
npm run db:seed
```

### Produção
```bash
# Build inclui geração do cliente Prisma
npm run build
```

## Principais Mudanças

### 1. Cliente Prisma (`src/lib/prisma.ts`)
- Cliente singleton para conexão com o banco
- Configurado para desenvolvimento e produção

### 2. Funções de Banco (`src/lib/database.ts`)
- Todas as funções foram migradas para usar Prisma
- Type safety melhorado com enums
- Queries mais legíveis e seguras
- Suporte para usuários e computadores inativos

### 3. Tipos TypeScript
- Enum `Status` para valores consistentes
- Interface `UsuarioInativo` e `ComputadorInativo` atualizadas
- Tipos gerados automaticamente pelo Prisma

## Vantagens da Migração

1. **Type Safety**: Tipos TypeScript gerados automaticamente
2. **Queries Seguras**: Prevenção de SQL injection
3. **Migrações**: Controle de versão do schema
4. **Prisma Studio**: Interface visual para o banco
5. **Performance**: Queries otimizadas
6. **Manutenibilidade**: Código mais limpo e legível

## Migração de Dados Existentes

Se você já tem dados no banco SQLite anterior:

1. O banco será criado automaticamente em `./data/usuarios_inativos.db`
2. Execute `npm run db:seed` para dados de exemplo
3. Use `npm run db:studio` para visualizar e gerenciar dados

## Status Enum

Os valores de status foram padronizados:

- `PENDENTE` (padrão)
- `EXONERADO`
- `TRANSFERIDO`
- `LIP`
- `AFASTADO_PARA_OUTRO_ORGAO`
- `LICENCA_MEDICA`
- `USUARIO_CORINGA`

## Exemplo de Uso

### Usuários Inativos
```typescript
import { prisma } from './lib/prisma';
import { Status } from '@prisma/client';

// Buscar usuários
const usuarios = await prisma.usuarioInativo.findMany({
  where: { status: Status.PENDENTE },
  orderBy: { dias_inativos: 'desc' }
});

// Criar usuário
const novoUsuario = await prisma.usuarioInativo.create({
  data: {
    username: 'novo.usuario',
    nome: 'Novo Usuário',
    status: Status.PENDENTE,
    // ... outros campos
  }
});
```

### Computadores Inativos
```typescript
// Buscar computadores
const computadores = await prisma.computadorInativo.findMany({
  where: { status: Status.PENDENTE },
  orderBy: { dias_inativos: 'desc' }
});

// Criar computador
const novoComputador = await prisma.computadorInativo.create({
  data: {
    nome_computador: 'PC-TI-001',
    ip_address: '192.168.1.100',
    departamento: 'TI',
    status: Status.PENDENTE,
    // ... outros campos
  }
});
```
