# 📚 BancoApuntes Unicauca

Banco de apuntes universitario. **Backend**: Node + Express + MongoDB (Mongoose). **Frontend**: React + Vite.

```
banco-apuntes/
├── server.js              ← arranca la API (puerto 5000)
├── package.json           ← dependencias del backend
├── .env                   ← configuración (Mongo, clave JWT)
├── config/db.js
├── models/                ← Usuario, Programa, Materia, Metodologia, Apunte, Archivo,
│                            Calificacion, Favorito, Comentario, Reporte, Notificacion
├── controllers/           ← auth, apunte, interaccion (estrellas/favoritos/comentarios), moderacion
├── middlewares/           ← auth.js (JWT + roles), upload.js (Multer)
├── routes/
├── utils/
├── database/seed.js       ← datos iniciales y cuentas de prueba
├── uploads/               ← aquí se guardan los archivos subidos
└── frontend/              ← app React (Vite)
```

## ▶️ Cómo ejecutarlo

Necesitas **Node 18+** y **MongoDB** encendido (el de tu computador, el que ves en Compass: `mongodb://127.0.0.1:27017`).

**1. Backend** (en la carpeta `banco-apuntes`)
```bash
npm install
npm run seed:reset     # ⚠️ borra las colecciones de la app y las recrea con datos de prueba
npm run dev            # API en http://localhost:5000/api
```
Comprueba que funciona abriendo http://localhost:5000/api/apuntes en el navegador (debe mostrar JSON).

**2. Frontend** (otra terminal, en `banco-apuntes/frontend`)
```bash
npm install
npm run dev            # http://localhost:5173
```

## 👤 Cuentas de prueba
| Rol | Correo | Contraseña |
|---|---|---|
| Admin | admin@unicauca.edu.co | Admin123* |
| Estudiante | maria@unicauca.edu.co | Estudiante123* |
| Estudiante | juan@unicauca.edu.co | Estudiante123* |

## ✨ Qué incluye
- Registro / inicio de sesión (JWT) con roles: estudiante, moderador, admin.
- Explorar apuntes con buscador, filtros (programa, materia, metodología) y orden.
- Subir apuntes con **archivos desde el computador** (PDF, Word, PPT, Excel, imágenes, audio, video; 25 MB c/u, hasta 10). Se guardan en `uploads/` y su registro en la colección `archivos`.
- Calificación con estrellas **1 a 5** (una por usuario, se puede cambiar) y promedio en tiempo real.
- Favoritos con vista propia.
- Comentarios, reportes de apuntes y notificaciones (🔔).
- Perfil con estadísticas, edición de datos y gestión de tus apuntes (editar, borrador/publicar, eliminar).
- Panel de administración: resumen, reportes, moderación de apuntes, usuarios y catálogo.

## 🗄️ Base de datos
Colecciones que usa la app: `usuarios, programas, materias, metodologias, apuntes, archivos, calificaciones, favoritos, comentarios, reportes, notificaciones`.

- **Borra** la colección `calificacions` (duplicada por error de Mongoose; ya está corregido en el modelo). `npm run seed:reset` la elimina por ti.
- Para conservar tus datos viejos, cambia `MONGO_URI` en `.env` a otra base (ej. `.../banco_apuntes_nuevo`) y corre `npm run seed`.

## 🛠️ Si algo falla
- *No hay conexión con el servidor*: el backend no está corriendo (`npm run dev`) o el puerto no es el 5000 (cambia `VITE_API_URL` en `frontend/.env`).
- *No se pudo conectar a MongoDB*: inicia el servicio de MongoDB o corrige `MONGO_URI`.
- Tras cambiar un `.env` reinicia el servidor correspondiente.
