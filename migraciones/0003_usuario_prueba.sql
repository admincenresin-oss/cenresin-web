-- Usuario de PRUEBA del panel de noticias.
-- Usuario: prueba   Contraseña: Noticias-Cenresin-2026
-- Cambia la contraseña o desactiva esta cuenta antes de entregar el sitio (ver LEEME-NOTICIAS.txt).
INSERT INTO usuarios (usuario, nombre, hash, sal, activo) VALUES ('prueba', 'Usuario de prueba', 'a3ce58a77204a2c24f755a8ddfff477a177076cc934e6e560b23230effe608cc', '3d122ecfaf1295c6c91f2e46d71d938f', 1) ON CONFLICT(usuario) DO UPDATE SET hash = excluded.hash, sal = excluded.sal, nombre = excluded.nombre, activo = 1;
