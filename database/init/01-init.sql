-- Script de inicialização do banco de dados Segurança SMUL
-- Este script é executado automaticamente quando o container MySQL é criado

-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS seguranca_smul 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar o banco de dados
USE seguranca_smul;

-- Configurações do MySQL para melhor performance
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 32M;
SET GLOBAL query_cache_type = 1;

-- Criar usuário específico para a aplicação (se não existir)
CREATE USER IF NOT EXISTS 'seguranca_user'@'%' IDENTIFIED BY 'seguranca_password';
GRANT ALL PRIVILEGES ON seguranca_smul.* TO 'seguranca_user'@'%';

-- Aplicar privilégios
FLUSH PRIVILEGES;

-- Log de inicialização
INSERT INTO information_schema.INNODB_METRICS (name, subsystem, type, comment) 
VALUES ('docker_init', 'docker', 'status', 'Banco inicializado via Docker') 
ON DUPLICATE KEY UPDATE comment = 'Banco inicializado via Docker';
