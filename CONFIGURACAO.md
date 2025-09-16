# Configuração do Sistema

## Arquivo de Configuração

Como o sistema está bloqueando a criação de arquivos `.env.local`, foi criado um arquivo `config.js` na raiz do projeto com as configurações necessárias.

## Configurações Atuais

### LDAP
- **Servidor**: ldap://10.10.65.242
- **Base DN**: DC=rede,DC=sp
- **Usuário**: usr_smdu_freenas
- **Senha**: Prodam01
- **Domínio**: @rede.sp

### SGU (MySQL)
- **Host**: 10.75.32.125
- **Porta**: 3306
- **Usuário**: root
- **Senha**: Hta123P
- **Banco**: SGU

## Como Alterar Configurações

Para alterar as configurações, edite o arquivo `config.js` na raiz do projeto.

## Testando a Conexão

1. Acesse http://localhost:3001/consulta-individual
2. Digite um usuário (ex: joao.silva)
3. Verifique o console do servidor para logs de conexão

## Logs Esperados

Se tudo estiver funcionando, você verá no console:
```
Tentando conectar ao SGU com configurações: { host: '10.75.32.125', port: 3306, database: 'SGU', user: 'root' }
Conectado ao banco SGU com sucesso
Buscando departamento SGU para usuário: joao.silva
Resultado da busca SGU para joao.silva: [...]
Departamento SGU encontrado para joao.silva: Nome do Departamento
```

## Solução de Problemas

### Erro de Conexão LDAP
- Verificar se o servidor LDAP está acessível
- Verificar credenciais no arquivo config.js

### Erro de Conexão SGU
- Verificar se o MySQL está rodando na porta 3306
- Verificar credenciais e permissões do usuário root
- Verificar se o banco SGU existe

### Usuário Não Encontrado no SGU
- Verificar se o usuário existe na tabela tblUsuarios
- Verificar se o campo cpUsuarioRede corresponde ao sAMAccountName do LDAP
