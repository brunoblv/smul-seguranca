# 🐳 Segurança SMUL - Docker

Este documento explica como executar o sistema Segurança SMUL usando Docker.

## 📋 Pré-requisitos

- Docker Desktop (Windows/Mac) ou Docker Engine (Linux)
- Docker Compose
- 4GB de RAM disponível
- Portas 80, 3000, 3306 e 6379 livres

## 🚀 Inicialização Rápida

### Windows
```bash
# Execute o script de configuração
docker-setup.bat
```

### Linux/Mac
```bash
# Dar permissão de execução
chmod +x docker-setup.sh

# Execute o script de configuração
./docker-setup.sh
```

### Manual
```bash
# 1. Copiar configurações
cp env.docker.example .env.local

# 2. Editar configurações (especialmente LDAP)
# Edite o arquivo .env.local

# 3. Iniciar containers
docker-compose up --build -d

# 4. Executar migrações
docker-compose exec app npx prisma db push

# 5. Executar seed
docker-compose exec app npx prisma db seed
```

## 🏗️ Arquitetura Docker

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Next.js App   │    │     MySQL       │
│   (Port 80)     │───▶│   (Port 3000)   │───▶│   (Port 3306)   │
│  Proxy Reverso  │    │   Aplicação     │    │    Banco        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Port 6379)   │
                       │     Cache       │
                       └─────────────────┘
```

## 📁 Estrutura de Arquivos

```
seguranca-smul/
├── Dockerfile                 # Imagem da aplicação
├── docker-compose.yml         # Orquestração dos serviços
├── .dockerignore             # Arquivos ignorados no build
├── env.docker.example        # Exemplo de variáveis de ambiente
├── docker-setup.sh           # Script de setup (Linux/Mac)
├── docker-setup.bat          # Script de setup (Windows)
├── nginx/
│   └── nginx.conf            # Configuração do proxy
├── database/
│   ├── init/
│   │   ├── 01-init.sql       # Inicialização do banco
│   │   └── 02-seed.sql       # Dados iniciais
│   └── backups/              # Backups do banco
└── logs/                     # Logs da aplicação
```

## 🔧 Configuração

### Variáveis de Ambiente

Edite o arquivo `.env.local` com suas configurações:

```env
# Banco de dados
DATABASE_URL="mysql://seguranca_user:seguranca_password@localhost:3306/seguranca_smul"

# LDAP (OBRIGATÓRIO)
LDAP_SERVER="ldap://seu-servidor-ldap"
LDAP_DOMAIN="@seu-dominio"
LDAP_BASE="DC=seu,DC=dominio"
LDAP_USER="usuario-ldap"
LDAP_PASS="senha-ldap"

# JWT
JWT_SECRET="sua-chave-secreta-jwt"
```

### Configuração LDAP

1. **Servidor LDAP**: Endereço do seu servidor Active Directory
2. **Domínio**: Sufixo dos usuários (ex: @rede.sp)
3. **Base DN**: Caminho base no AD (ex: DC=rede,DC=sp)
4. **Usuário/Senha**: Credenciais para conectar ao LDAP

## 🎮 Comandos Úteis

### Gerenciamento de Containers

```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Reiniciar um serviço específico
docker-compose restart app

# Ver logs em tempo real
docker-compose logs -f app

# Ver status dos containers
docker-compose ps
```

### Banco de Dados

```bash
# Acessar MySQL
docker-compose exec db mysql -u seguranca_user -p seguranca_smul

# Backup do banco
docker-compose exec db mysqldump -u seguranca_user -p seguranca_smul > backup.sql

# Restaurar backup
docker-compose exec -T db mysql -u seguranca_user -p seguranca_smul < backup.sql

# Executar migrações Prisma
docker-compose exec app npx prisma db push

# Executar seed
docker-compose exec app npx prisma db seed
```

### Aplicação

```bash
# Acessar shell da aplicação
docker-compose exec app sh

# Instalar nova dependência
docker-compose exec app npm install nova-dependencia

# Rebuild da aplicação
docker-compose build app
docker-compose up -d app
```

## 🔍 Monitoramento

### Logs

```bash
# Todos os logs
docker-compose logs -f

# Logs da aplicação
docker-compose logs -f app

# Logs do banco
docker-compose logs -f db

# Logs do Nginx
docker-compose logs -f nginx
```

### Health Checks

```bash
# Verificar saúde da aplicação
curl http://localhost/health

# Verificar status dos containers
docker-compose ps
```

## 🚨 Troubleshooting

### Problemas Comuns

**1. Container não inicia**
```bash
# Ver logs de erro
docker-compose logs app

# Verificar se as portas estão livres
netstat -an | findstr :3000
```

**2. Erro de conexão com banco**
```bash
# Verificar se o banco está rodando
docker-compose ps db

# Ver logs do banco
docker-compose logs db
```

**3. Erro de LDAP**
```bash
# Verificar configurações no .env.local
# Testar conectividade com o servidor LDAP
```

**4. Problemas de permissão (Linux/Mac)**
```bash
# Dar permissões corretas
sudo chown -R $USER:$USER .
chmod +x docker-setup.sh
```

### Limpeza Completa

```bash
# Parar e remover tudo
docker-compose down -v

# Remover imagens
docker rmi seguranca-smul_app

# Limpar sistema Docker
docker system prune -a
```

## 📊 Performance

### Recursos Recomendados

- **CPU**: 2 cores
- **RAM**: 4GB
- **Disco**: 10GB livres
- **Rede**: 100Mbps

### Otimizações

```yaml
# No docker-compose.yml, ajustar recursos:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

## 🔒 Segurança

### Configurações de Segurança

1. **Alterar senhas padrão** no `.env.local`
2. **Configurar SSL** no Nginx (certificados em `nginx/ssl/`)
3. **Restringir acesso** por IP se necessário
4. **Backup regular** do banco de dados

### Firewall

```bash
# Liberar apenas portas necessárias
# 80 (HTTP), 443 (HTTPS), 22 (SSH)
```

## 📈 Escalabilidade

### Para Produção

1. **Usar volumes externos** para persistência
2. **Configurar SSL/TLS** com certificados válidos
3. **Implementar load balancer** para múltiplas instâncias
4. **Configurar monitoramento** (Prometheus, Grafana)
5. **Backup automatizado** do banco

### Exemplo de Produção

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: seguranca-smul:latest
    deploy:
      replicas: 3
    volumes:
      - /var/lib/seguranca-smul/data:/app/data
```

## 📞 Suporte

Para problemas específicos do Docker:

1. Verificar logs: `docker-compose logs -f`
2. Verificar configurações no `.env.local`
3. Testar conectividade de rede
4. Verificar recursos disponíveis

---

**Desenvolvido para Segurança SMUL** 🛡️
