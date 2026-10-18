-- Base de datos del blog Noticias de CENRESIN (Cloudflare D1)
CREATE TABLE IF NOT EXISTS noticias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  resumen TEXT,
  cuerpo TEXT NOT NULL,
  fecha TEXT NOT NULL,                       -- AAAA-MM-DD (hora de Chile)
  imagen_url TEXT,
  imagen_alt TEXT,
  mostrar_inicio INTEGER NOT NULL DEFAULT 0, -- interruptor: sección de noticias de la página de bienvenida
  mostrar_estudios INTEGER NOT NULL DEFAULT 0, -- interruptor: sección de noticias de Estudios Clínicos
  autor TEXT,
  creado TEXT,
  actualizado TEXT
);
CREATE INDEX IF NOT EXISTS idx_noticias_fecha ON noticias (fecha DESC);

CREATE TABLE IF NOT EXISTS imagenes (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  datos BLOB NOT NULL,
  creado TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT NOT NULL UNIQUE,
  nombre TEXT,
  hash TEXT NOT NULL,
  sal TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sesiones (
  token TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  expira TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS intentos_login (
  ip TEXT NOT NULL,
  fecha TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_intentos_ip ON intentos_login (ip, fecha);
