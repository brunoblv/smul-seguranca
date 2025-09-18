#!/bin/bash

# Script de configuração e inicialização do Segurança SMUL com Docker
# Execute este script para configurar e iniciar o ambiente Docker

echo "🚀 Configurando Segurança SMUL com Docker..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Criar diretórios necessários
echo "📁 Criando diretórios necessários..."
mkdir -p logs/nginx
mkdir -p database/backups
mkdir -p nginx/ssl

# Copiar arquivo de ambiente se não existir
if [ ! -f .env.local ]; then
    echo "📝 Criando arquivo de ambiente..."
    cp env.docker.example .env.local
    echo "⚠️  Por favor, edite o arquivo .env.local com suas configurações antes de continuar."
    echo "   Especialmente as configurações de LDAP."
    read -p "Pressione Enter para continuar após editar o .env.local..."
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Remover volumes antigos (opcional - descomente se quiser limpar dados)
# echo "🗑️  Removendo volumes antigos..."
# docker-compose down -v

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
docker-compose up --build -d

# Aguardar banco de dados estar pronto
echo "⏳ Aguardando banco de dados estar pronto..."
sleep 30

# Executar migrações do Prisma
echo "🗄️  Executando migrações do Prisma..."
docker-compose exec app npx prisma db push

# Executar seed do banco
echo "🌱 Executando seed do banco de dados..."
docker-compose exec app npx prisma db seed

# Verificar status dos containers
echo "📊 Verificando status dos containers..."
docker-compose ps

echo ""
echo "✅ Segurança SMUL configurado com sucesso!"
echo ""
echo "🌐 Aplicação disponível em:"
echo "   - HTTP: http://localhost"
echo "   - Aplicação: http://localhost:3000"
echo "   - Banco: localhost:3306"
echo ""
echo "👤 Usuário administrador padrão:"
echo "   - Username: admin"
echo "   - Senha: (definir no primeiro login)"
echo ""
echo "📋 Comandos úteis:"
echo "   - Ver logs: docker-compose logs -f"
echo "   - Parar: docker-compose down"
echo "   - Reiniciar: docker-compose restart"
echo "   - Backup DB: docker-compose exec db mysqldump -u seguranca_user -p seguranca_smul > backup.sql"
echo ""
echo "🔧 Para configurar LDAP, edite o arquivo .env.local"
echo ""
