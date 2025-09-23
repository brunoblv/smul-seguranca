# Configuração do Banco de Assinatura

## Problema Identificado

A variável `ASSINATURA_DATABASE_URL` no arquivo `.env` contém caracteres extras que impedem a conexão:

```env
# ❌ INCORRETO - tem @@ extras e quebras de linha
ASSINATURA_DATABASE_URL="mysql://usuario:Hta123P@@@10.75.32.170:3306/assinatura 
"
```

## Solução

### 1. Corrigir o arquivo .env

Edite o arquivo `.env` e corrija a linha:

```env
# ✅ CORRETO
ASSINATURA_DATABASE_URL="mysql://usuario:Hta123P@10.75.32.170:3306/assinatura"
```

### 2. Adicionar variáveis individuais (Recomendado)

Para maior flexibilidade, adicione estas variáveis ao `.env`:

```env
# Configurações do Banco de Assinatura
ASSINATURA_DB_HOST="10.75.32.170"
ASSINATURA_DB_PORT="3306"
ASSINATURA_DB_NAME="assinatura"
ASSINATURA_DB_USER="usuario"
ASSINATURA_DB_PASSWORD="Hta123P@"
```

### 3. Verificar Acesso ao Banco

Antes de usar a página de segurança, verifique se:

1. **Servidor acessível**: O IP `10.75.32.170` está acessível da sua rede
2. **Porta aberta**: A porta `3306` está liberada
3. **Credenciais corretas**: Usuário `usuario` existe no banco
4. **Permissões**: O usuário tem acesso ao banco `assinatura`
5. **Tabela existe**: A tabela `usuarios` existe no banco

### 4. Testar Conexão

Para testar a conexão, você pode usar este script:

```javascript
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: "10.75.32.170",
      port: 3306,
      database: "assinatura",
      user: "usuario",
      password: "Hta123P@"
    });
    
    console.log("✅ Conexão bem-sucedida!");
    
    // Testar consulta
    const [rows] = await connection.execute("SELECT COUNT(*) as total FROM usuarios");
    console.log(`Total de usuários: ${rows[0].total}`);
    
    await connection.end();
  } catch (error) {
    console.error("❌ Erro de conexão:", error.message);
  }
}

testConnection();
```

## Funcionalidade Atual

A página de segurança está funcionando com **dados simulados** enquanto o acesso ao banco não é resolvido. Isso permite:

- ✅ Testar a interface
- ✅ Verificar a funcionalidade
- ✅ Demonstrar o sistema

## Próximos Passos

1. **Corrigir o .env** com as configurações corretas
2. **Verificar acesso** ao servidor de banco de assinatura
3. **Testar conexão** usando o script acima
4. **Atualizar credenciais** se necessário
5. **Remover dados simulados** da API quando a conexão estiver funcionando

## Estrutura Esperada da Tabela

A tabela `usuarios` deve ter pelo menos estes campos:

```sql
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  login VARCHAR(255) NOT NULL,
  nome VARCHAR(255),
  cargo VARCHAR(255),
  unidade VARCHAR(255),
  email VARCHAR(255),
  ativo BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Contato

Se precisar de ajuda com a configuração do banco, entre em contato com a equipe de TI responsável pelo servidor `10.75.32.170`.

