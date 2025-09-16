# Configuração MySQL - Formato Correto

## ❌ Formato Incorreto
```env
DATABASE_URL="seguranca"
```

## ✅ Formato Correto
```env
DATABASE_URL="mysql://usuario:senha@host:porta/nome_do_banco"
```

## Exemplos de Configuração

### 1. MySQL Local (padrão)
```env
DATABASE_URL="mysql://root:senha@localhost:3306/seguranca"
```

### 2. MySQL com usuário específico
```env
DATABASE_URL="mysql://admin:minhasenha@localhost:3306/seguranca"
```

### 3. MySQL remoto
```env
DATABASE_URL="mysql://usuario:senha@192.168.1.100:3306/seguranca"
```

### 4. MySQL com porta diferente
```env
DATABASE_URL="mysql://root:senha@localhost:3307/seguranca"
```

## Componentes da URL

- **mysql://** - Protocolo obrigatório
- **usuario** - Nome do usuário do MySQL
- **senha** - Senha do usuário
- **host** - Endereço do servidor (localhost, IP, etc.)
- **porta** - Porta do MySQL (padrão: 3306)
- **nome_do_banco** - Nome do banco de dados

## Próximos Passos

1. **Corrigir o .env** com o formato correto
2. **Criar o banco** no MySQL:
   ```sql
   CREATE DATABASE seguranca CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. **Testar conexão**:
   ```bash
   npx prisma db push
   ```
