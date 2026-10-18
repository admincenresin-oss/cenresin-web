#!/bin/bash
# Doble clic para publicar el sitio CENRESIN en Cloudflare (Mac).
cd "$(dirname "$0")" || exit 1
clear
echo "=== Publicar CENRESIN en Cloudflare ==="
echo
if ! command -v node >/dev/null 2>&1; then
  echo "Falta instalar Node.js. Descárgalo desde https://nodejs.org (versión LTS),"
  echo "instálalo y vuelve a abrir este archivo."
  read -n 1 -s -r -p "Presiona cualquier tecla para cerrar..."; exit 1
fi
echo "1/3  Iniciando sesión en Cloudflare (se abrirá el navegador; presiona «Allow»)"
npx --yes wrangler@4 login || { echo "No se pudo iniciar sesión."; read -n 1 -s -r -p "Presiona una tecla..."; exit 1; }
echo
echo "2/3  Preparando la base de datos de noticias"
npm run migrar || { echo "Falló la base de datos."; read -n 1 -s -r -p "Presiona una tecla..."; exit 1; }
echo
echo "3/3  Subiendo el sitio"
npm run publicar || { echo "Falló la publicación."; read -n 1 -s -r -p "Presiona una tecla..."; exit 1; }
echo
echo "Listo. Revisa https://cenresin.cl y https://cenresin.cl/admin-login"
read -n 1 -s -r -p "Presiona cualquier tecla para cerrar..."
