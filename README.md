
// 1. Registro de usuario
// Método: POST
// URL: http://localhost:5000/api/auth/registro
/*
Body (JSON):
{
  "nombre": "Carlos Mendoza",
  "email": "carlos.mendoza@uniautonoma.edu.co",
  "password": "password123",
  "rol": "ESTUDIANTE"
}
*/

// 2. Inicio de sesión
// Método: POST
// URL: http://localhost:5000/api/auth/login
/*
Body (JSON):
{
  "email": "carlos.mendoza@uniautonoma.edu.co",
  "password": "password123"
}
*/

// 3. Crear apunte
// Método: POST
// URL: http://localhost:5000/api/apuntes
/*
Body (JSON):
{
  "titulo": "Resumen Guía API REST Node.js",
  "descripcion": "Conceptos clave sobre métodos HTTP y ruteo.",
  "materia": "660000000000000000000021",
  "autor": "660000000000000000000001"
}
*/

// 4. Obtener todos los apuntes
// Método: GET
// URL: http://localhost:5000/api/apuntes
// Body: Ninguno (N/A)

// 5. Filtrar apuntes por materia
// Método: GET
// URL: http://localhost:5000/api/apuntes?materia=660000000000000000000021
// Body: Ninguno (N/A)

// 6. Crear comentario
// Método: POST
// URL: http://localhost:5000/api/interacciones/comentarios
/*
Body (JSON):
{
  "contenido": "Excelente resumen, me ayudó mucho.",
  "apunte": "660000000000000000000030",
  "usuario": "660000000000000000000002"
}
*/

// 7. Guardar en favoritos
// Método: POST
// URL: http://localhost:5000/api/interacciones/favoritos
/*
Body (JSON):
{
  "usuario": "660000000000000000000001",
  "apunte": "660000000000000000000031"
}
*/

// 8. Calificar un apunte
// Método: POST
// URL: http://localhost:5000/api/interacciones/calificaciones
/*
Body (JSON):
{
  "puntuacion": 5,
  "apunte": "660000000000000000000030",
  "usuario": "660000000000000000000002"
}
*/

// 9. Crear reporte
// Método: POST
// URL: http://localhost:5000/api/moderacion/reportes
/*
Body (JSON):
{
  "motivo": "Contenido incompleto o desactualizado",
  "apunte": "660000000000000000000030",
  "reportadoPor": "660000000000000000000002"
}
*/

// 10. Moderar / Actualizar apunte
// Método: PATCH
// URL: http://localhost:5000/api/moderacion/apuntes/660000000000000000000030
/*
Body (JSON):
{
  "estado": "REVISADO"
}
*/



| N.º    | Historia de Usuario | Funcionalidad | Endpoint y Método HTTP | Resultado Esperado |

| **1** | Como estudiante, quiero registrar una cuenta para acceder a la plataforma. | Registro de usuario | `POST /api/auth/registro` | 201 Created + Token/JSON |
| **2** | Como estudiante, quiero iniciar sesión para autenticarme en el sistema. | Inicio de sesión | `POST /api/auth/login` | 200 OK + JWT Token |
| **3** | Como estudiante, quiero subir un nuevo apunte para compartirlo con otros. | Crear apunte | `POST /api/apuntes` | 201 Created + Objeto del apunte |
| **4** | Como estudiante, quiero listar todos los apuntes para encontrar material de estudio. | Obtener apuntes | `GET /api/apuntes` | 200 OK + Arreglo de apuntes |
| **5** | Como estudiante, quiero buscar apuntes por materia para filtrar por tema. | Filtrar apuntes | `GET /api/apuntes?materia=ID` | 200 OK + Lista filtrada |
| **6** | Como estudiante, quiero comentar en un apunte para hacer preguntas o aportes. | Crear comentario | `POST /api/interacciones/comentarios` | 201 Created + Comentario |
| **7** | Como estudiante, quiero guardar un apunte en favoritos para consultarlo luego. | Guardar en favoritos | `POST /api/interacciones/favoritos` | 201 Created / 200 OK |
| **8** | Como estudiante, quiero calificar un apunte para valorar su utilidad. | Calificar apunte | `POST /api/interacciones/calificaciones` | 200 OK / 201 Created |
| **9** | Como usuario, quiero reportar un contenido inadecuado para solicitar su revisión. | Crear reporte | `POST /api/moderacion/reportes` | 201 Created + Reporte |
| **10** | Como moderador, quiero eliminar o actualizar el estado de un contenido reportado. | Moderar apunte | `PATCH /api/moderacion/apuntes/:id` | 200 OK + Apunte actualizado |
