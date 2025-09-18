@echo off
REM Script de configuração e inicialização do Segurança SMUL com Docker para Windows
REM Execute este script para configurar e iniciar o ambiente Docker

echo 🚀 Configurando Segurança SMUL com Docker...

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker não está instalado. Por favor, instale o Docker primeiro.
    pause
    exit /b 1
)

REM Verificar se Docker Compose está instalado
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro.
    pause
    exit /b 1
)

REM Criar diretórios necessários
echo 📁 Criando diretórios necessários...
if not exist "logs\nginx" mkdir "logs\nginx"
if not exist "database\backups" mkdir "database\backups"
if not exist "nginx\ssl" mkdir "nginx\ssl"

REM Copiar arquivo de ambiente se não existir
if not exist ".env.local" (
    echo 📝 Criando arquivo de ambiente...
    copy "env.docker.example" ".env.local"
    echo ⚠️  Por favor, edite o arquivo .env.local com suas configurações antes de continuar.
    echo    Especialmente as configurações de LDAP.
    pause
)

REM Parar containers existentes
echo 🛑 Parando containers existentes...
docker-compose down

REM Construir e iniciar containers
echo 🔨 Construindo e iniciando containers...
docker-compose up --build -d

REM Aguardar banco de dados estar pronto
echo ⏳ Aguardando banco de dados estar pronto...
timeout /t 30 /nobreak >nul

REM Executar migrações do Prisma
echo 🗄️  Executando migrações do Prisma...
docker-compose exec app npx prisma db push

REM Executar seed do banco
echo 🌱 Executando seed do banco de dados...
docker-compose exec app npx prisma db seed

REM Verificar status dos containers
echo 📊 Verificando status dos containers...
docker-compose ps

echo.
echo ✅ Segurança SMUL configurado com sucesso!
echo.
echo 🌐 Aplicação disponível em:
echo    - HTTP: http://localhost
echo    - Aplicação: http://localhost:3000
echo    - Banco: localhost:3306
echo.
echo 👤 Usuário administrador padrão:
echo    - Username: admin
echo    - Senha: (definir no primeiro login)
echo.
echo 📋 Comandos úteis:
echo    - Ver logs: docker-compose logs -f
echo    - Parar: docker-compose down
echo    - Reiniciar: docker-compose restart
echo    - Backup DB: docker-compose exec db mysqldump -u seguranca_user -p seguranca_smul > backup.sql
echo.
echo 🔧 Para configurar LDAP, edite o arquivo .env.local
echo.
pause
