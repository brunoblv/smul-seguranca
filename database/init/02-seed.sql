-- Script de seed para dados iniciais
-- Este script popula o banco com dados básicos necessários

USE seguranca_smul;

-- Aguardar um pouco para garantir que as tabelas foram criadas pelo Prisma
-- (Este script será executado após o Prisma fazer o push do schema)

-- Inserir usuário administrador padrão (se não existir)
-- NOTA: A senha deve ser alterada após o primeiro login
INSERT IGNORE INTO usuarios (username, nome, email, admin, ativo, data_criacao, ultimo_login) 
VALUES (
    'admin', 
    'Administrador do Sistema', 
    'admin@smul.sp.gov.br', 
    1, 
    1, 
    NOW(), 
    NOW()
);

-- Inserir permissões do administrador
INSERT IGNORE INTO usuario_permissoes (usuario_id, permissao)
SELECT u.id, 'ADMINISTRAR_SISTEMA'
FROM usuarios u 
WHERE u.username = 'admin' 
AND NOT EXISTS (
    SELECT 1 FROM usuario_permissoes up 
    WHERE up.usuario_id = u.id 
    AND up.permissao = 'ADMINISTRAR_SISTEMA'
);

-- Inserir todas as permissões para o admin
INSERT IGNORE INTO usuario_permissoes (usuario_id, permissao)
SELECT u.id, p.permissao
FROM usuarios u
CROSS JOIN (
    SELECT 'VISUALIZAR_TICKETS' as permissao
    UNION SELECT 'CRIAR_TICKETS'
    UNION SELECT 'EDITAR_TICKETS'
    UNION SELECT 'FECHAR_TICKETS'
    UNION SELECT 'VISUALIZAR_USUARIOS'
    UNION SELECT 'CRIAR_USUARIOS'
    UNION SELECT 'EDITAR_USUARIOS'
    UNION SELECT 'ADMINISTRAR_SISTEMA'
) p
WHERE u.username = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM usuario_permissoes up 
    WHERE up.usuario_id = u.id 
    AND up.permissao = p.permissao
);

-- Log de seed
INSERT INTO information_schema.INNODB_METRICS (name, subsystem, type, comment) 
VALUES ('docker_seed', 'docker', 'status', 'Dados iniciais inseridos via Docker') 
ON DUPLICATE KEY UPDATE comment = 'Dados iniciais inseridos via Docker';
