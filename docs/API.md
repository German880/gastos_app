# Gastos App: Contrato de la API REST

> Este documento define el acuerdo entre frontend y backend: rutas, métodos, autenticación,
> formato de errores y códigos de estado. Se complementa con `PROJECT_SPEC.md`, que define
> el modelo de datos y las reglas de negocio.

---

## 1. Convenciones generales

- Todas las rutas empiezan con el prefijo `/api`.
- Formato de datos: JSON (`Content-Type: application/json`).
- Autenticación: JWT en la cabecera `Authorization: Bearer <token>`.
- **Todas las rutas requieren autenticación, excepto** `POST /api/auth/register` y `POST /api/auth/login`.
- El `userId` siempre sale del token, nunca del body ni de la URL.
- Fechas en formato ISO 8601 (`YYYY-MM-DD`).
- Dinero como número (en el backend, tipo `Decimal` en Prisma — nunca `Float`).

## 2. Formato de errores

Toda respuesta de error sigue esta misma forma, sin excepción:

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "No tienes saldo suficiente en tu buzón General",
    "fields": { "amount": "Debe ser mayor a 0" }
  }
}
```

- `code`: identificador técnico en mayúsculas, estable, para que el frontend decida lógica (ej. mostrar un botón distinto). Nunca se muestra al usuario.
- `message`: texto en español, listo para mostrar al usuario.
- `fields` (opcional): errores de validación por campo, para marcarlos en el formulario.

## 3. Códigos de estado HTTP

| Código | Significado | Cuándo se usa |
|---|---|---|
| `200` | OK | Lectura o actualización exitosa |
| `201` | Creado | Un recurso nuevo se creó correctamente |
| `204` | Sin contenido | Eliminación exitosa (sin cuerpo en la respuesta) |
| `400` | Solicitud inválida | Error de validación de formato (Zod) |
| `401` | No autenticado | Token ausente, inválido o expirado |
| `403` | Sin permiso | Autenticado, pero no es el dueño del recurso o no es admin |
| `404` | No encontrado | El recurso con ese `:id` no existe |
| `409` | Conflicto | Email/username repetido, invitación duplicada, nombre de categoría repetido |
| `422` | Regla de negocio violada | Ej. saldo insuficiente, fecha futura, monto no positivo |

---

## 4. Endpoints por módulo

### 4.1 Auth y usuario

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Crea el usuario y su budget "General" |
| `POST` | `/api/auth/login` | No | Devuelve el JWT (24h) |
| `PATCH` | `/api/user/onboarding` | Sí | Guarda saldo inicial e ingreso mensual/día de pago |
| `GET` | `/api/user/profile` | Sí | Devuelve los datos del usuario autenticado |
| `PATCH` | `/api/user/profile` | Sí | Edita nombre/email |
| `PATCH` | `/api/user/password` | Sí | Cambia la contraseña (requiere la actual) |

### 4.2 Budgets ("Fondos")

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/budgets` | Sí | Lista los fondos del usuario |
| `POST` | `/api/budgets` | Sí | Crea un fondo (resta del General) |
| `PATCH` | `/api/budgets/:id` | Sí | Edita nombre/icono |
| `PATCH` | `/api/budgets/:id/deposit` | Sí | Agrega dinero (solo al General) |
| `PATCH` | `/api/budgets/:id/close` | Sí | Finaliza el fondo (mueve el saldo restante si aplica) |
| `POST` | `/api/budget-transfers` | Sí | Transfiere dinero entre dos fondos propios |

### 4.3 Expenses ("Gastos")

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/expenses` | Sí | Lista gastos. Query params: `categoryId`, `budgetId`, `date`, `page`, `limit` (todos opcionales y combinables) |
| `POST` | `/api/expenses` | Sí | Crea un gasto y resta del fondo elegido |
| `PATCH` | `/api/expenses/:id` | Sí | Edita un gasto (recalcula balances si cambia monto/fondo) |
| `DELETE` | `/api/expenses/:id` | Sí | Elimina un gasto y devuelve el monto al fondo |

### 4.4 Groups

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/groups` | Sí | Crea un grupo (el creador queda como miembro aceptado) |
| `GET` | `/api/groups` | Sí | Lista mis grupos |
| `GET` | `/api/groups/:id` | Sí | Detalle del grupo: resumen por integrante |
| `DELETE` | `/api/groups/:id` | Sí | Elimina el grupo (solo el creador) |
| `POST` | `/api/groups/:id/invite` | Sí | Invita por username/email (solo el creador). Body: `{ "usernameOrEmail": "..." }` |
| `PATCH` | `/api/groups/:groupId/members/:memberId` | Sí | Acepta la invitación |
| `DELETE` | `/api/groups/:groupId/members/:memberId` | Sí | Rechaza la invitación o sale del grupo |

### 4.5 Reviews

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/reviews` | Sí | Crea mi review (si no existe) |
| `PATCH` | `/api/reviews` | Sí | Actualiza mi review (el token identifica cuál, relación 1 a 1) |
| `GET` | `/api/reviews` | Sí | Devuelve mi propia review |

### 4.6 Categories (gestionadas por admin, leídas por todos)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/categories` | Sí | Lista todas las categorías (cualquier usuario autenticado) |
| `POST` | `/api/categories` | Sí (admin) | Crea una categoría |
| `PATCH` | `/api/categories/:id` | Sí (admin) | Edita una categoría |
| `DELETE` | `/api/categories/:id` | Sí (admin) | Elimina (rechaza si tiene gastos asociados) |

### 4.7 Admin

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/users` | Sí (admin) | Lista todos los usuarios |
| `PATCH` | `/api/admin/users/:id` | Sí (admin) | Activa/desactiva un usuario |
| `GET` | `/api/admin/reviews` | Sí (admin) | Lista todas las reviews |
| `GET` | `/api/admin/metrics` | Sí (admin) | Métricas agregadas de la plataforma |

---

## 5. Notas de diseño (decisiones tomadas durante el mapeo)

- Las URLs identifican **recursos** (sustantivos), nunca acciones; el método HTTP indica la acción.
- Acciones especiales que no son CRUD simple (`deposit`, `close`, `invite`) se modelan como sub-rutas de acción sobre el recurso, no como verbos en el nombre del recurso principal.
- Una transferencia involucra dos fondos, así que se modela como su propio recurso (`/budget-transfers`) en vez de forzarla dentro de la ruta de un solo fondo.
- `groupMember` es un sub-recurso de `group`, por eso va anidado (`/groups/:groupId/members/:memberId`).
- Rechazar una invitación y salir de un grupo usan el mismo endpoint (`DELETE` sobre la propia membresía): son la misma operación de negocio en momentos distintos del flujo.
- `reviews` no usa `:id` porque la relación usuario-review es 1 a 1; el token ya es suficiente para identificar el recurso.
- Todos los filtros de listas van como *query params* opcionales y combinables, nunca como rutas separadas por tipo de filtro.
