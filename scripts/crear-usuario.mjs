// Crea la instrucción SQL para agregar un usuario al panel de noticias.
// Uso: node scripts/crear-usuario.mjs usuario "Contraseña segura" "Nombre visible"
// Luego: npx wrangler d1 execute cenresin-noticias --remote --command "<la instrucción>"
import { webcrypto } from 'node:crypto';
import { hashClave } from '../worker/index.js';

const [usuario, clave, nombre = usuario] = process.argv.slice(2);
if (!usuario || !clave) {
  console.error('Uso: node scripts/crear-usuario.mjs usuario "contraseña" "Nombre"');
  process.exit(1);
}
const sal = Buffer.from(webcrypto.getRandomValues(new Uint8Array(16))).toString('hex');
const hash = await hashClave(clave, sal);
const q = (t) => `'${String(t).replace(/'/g, "''")}'`;
console.log(`INSERT INTO usuarios (usuario, nombre, hash, sal, activo) VALUES (${q(usuario.toLowerCase())}, ${q(nombre)}, ${q(hash)}, ${q(sal)}, 1) ON CONFLICT(usuario) DO UPDATE SET hash = excluded.hash, sal = excluded.sal, nombre = excluded.nombre, activo = 1;`);
