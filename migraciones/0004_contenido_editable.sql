-- Contenido administrable de las páginas públicas de CENRESIN.
-- Cada módulo mantiene una versión borrador y otra publicada para permitir vista previa.
CREATE TABLE IF NOT EXISTS contenido_sitio (
  clave TEXT PRIMARY KEY,
  borrador TEXT NOT NULL,
  publicado TEXT NOT NULL,
  actualizado TEXT NOT NULL,
  publicado_en TEXT
);
