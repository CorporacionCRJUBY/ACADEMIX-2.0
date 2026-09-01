-- =====================================================
-- Academix 2.0 — Setup seguro de MySQL / MariaDB
-- =====================================================
-- Ejecutar como usuario root (o con GRANT OPTION):
--   mysql -uroot -p < database/setup-mysql.sql
--
-- Antes de ejecutar: reemplazar <DB_PASSWORD> por la contraseña real.
-- Este script NUNCA debe guardarse con la contraseña real en el repo.
--
-- Qué hace:
--   1. Crea la base academix_v2 (utf8mb4).
--   2. Crea el usuario ADMIN limitado a ESA base (sin privilegios
--      globales): si la contraseña se filtra, el daño queda acotado
--      a academix_v2.
--   3. Otorga solo los privilegios que la app necesita (runtime +
--      migraciones knex), no ALL PRIVILEGES.
--   4. Aplica los cambios.

CREATE DATABASE IF NOT EXISTS academix_v2
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 'localhost' cubre conexiones TCP desde 127.0.0.1 cuando el servidor
-- resuelve nombres; '127.0.0.1' cubre el caso con skip_name_resolve.
CREATE USER IF NOT EXISTS 'ADMIN'@'localhost' IDENTIFIED BY 'J-Admin-Crfenix123';
CREATE USER IF NOT EXISTS 'ADMIN'@'127.0.0.1' IDENTIFIED BY 'J-Admin-Crfenix123';

-- Privilegios mínimos:
--   SELECT/INSERT/UPDATE/DELETE -> runtime de la API
--   CREATE/DROP/ALTER/INDEX/REFERENCES -> migraciones knex (tablas y FK)
--   CREATE VIEW / SHOW VIEW / TRIGGER / LOCK TABLES -> operaciones
--     auxiliares que las migraciones o el motor puedan requerir
-- Sin GRANT OPTION, FILE, SUPER, PROCESS, SHUTDOWN ni nada global.
GRANT SELECT, INSERT, UPDATE, DELETE,
      CREATE, DROP, ALTER, INDEX, REFERENCES,
      CREATE VIEW, SHOW VIEW, TRIGGER, LOCK TABLES
  ON academix_v2.*
  TO 'ADMIN'@'localhost';

GRANT SELECT, INSERT, UPDATE, DELETE,
      CREATE, DROP, ALTER, INDEX, REFERENCES,
      CREATE VIEW, SHOW VIEW, TRIGGER, LOCK TABLES
  ON academix_v2.*
  TO 'ADMIN'@'127.0.0.1';

FLUSH PRIVILEGES;

-- Verificación: debe listar SOLO academix_v2 y los privilegios de arriba.
-- SHOW DATABASES;
-- SHOW GRANTS FOR 'ADMIN'@'localhost';
