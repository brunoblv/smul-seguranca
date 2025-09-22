-- ===========================================
-- ADICIONAR CHAVE ESTRANGEIRA ENTRE tblUsuarios E tblUnidades
-- ===========================================

-- Verificar se a tabela tblUnidades existe e tem a estrutura esperada
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'SGU' 
    AND TABLE_NAME IN ('tblUsuarios', 'tblUnidades')
    AND COLUMN_NAME IN ('cpUnid', 'uid', 'id')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- Verificar se já existe uma chave estrangeira
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'SGU' 
    AND TABLE_NAME = 'tblUsuarios' 
    AND COLUMN_NAME = 'cpUnid'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Adicionar chave estrangeira (descomente a linha apropriada baseada na estrutura encontrada)

-- Opção 1: Se o campo na tblUnidades for 'uid'
-- ALTER TABLE tblUsuarios 
-- ADD CONSTRAINT fk_tblusuarios_cpunid_tblunidades_uid 
-- FOREIGN KEY (cpUnid) REFERENCES tblUnidades(uid);

-- Opção 2: Se o campo na tblUnidades for 'id'
-- ALTER TABLE tblUsuarios 
-- ADD CONSTRAINT fk_tblusuarios_cpunid_tblunidades_id 
-- FOREIGN KEY (cpUnid) REFERENCES tblUnidades(id);

-- Opção 3: Se o campo na tblUnidades for 'codigo'
-- ALTER TABLE tblUsuarios 
-- ADD CONSTRAINT fk_tblusuarios_cpunid_tblunidades_codigo 
-- FOREIGN KEY (cpUnid) REFERENCES tblUnidades(codigo);

-- Verificar se a chave estrangeira foi criada com sucesso
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'SGU' 
    AND TABLE_NAME = 'tblUsuarios' 
    AND CONSTRAINT_NAME LIKE 'fk_tblusuarios_cpunid%';
