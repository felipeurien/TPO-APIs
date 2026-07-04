# Liga Metropolitana de Basket - TPO APIs

Aplicacion web para administrar y consultar una liga de basket por categorias. El sistema tiene una vista publica para invitados y un panel privado para administradores.

El proyecto esta dividido en:

- `Backend`: API REST con Node.js, Express y MySQL.
- `Frontend`: aplicacion React/Vite.

## Funcionalidades principales

- Consulta publica de ligas, equipos, jugadores, entrenadores, fixture, resultados y posiciones.
- Panel de administracion con login JWT.
- ABM de ligas, equipos, jugadores, entrenadores, partidos y administradores.
- ABM de categorias para cargar equipos/jugadores desde dropdown.
- Carga de resultados desde el panel admin.
- Clasificacion automatica por liga/categoria.
- Numero de fecha por partido y calculo de fecha actual por liga.
- Fixture agrupado por numero de fecha.
- Playoffs automaticos: semifinales y final a partido unico.
- Vista responsive para desktop, tablet y celular.

## Stack

### Backend

- Node.js
- Express
- MySQL
- mysql2/promise
- bcrypt
- jsonwebtoken
- dotenv

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend `.env`

Crear `Backend/.env` con:

```env
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=liga_basket

PORT=3000

JWT_SECRET=clave_local_para_tpo_liga_basket
JWT_EXPIRES_IN=2h
```

### Frontend `.env`

El frontend puede usar `Frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Tambien existe `Frontend/.env.example` con ese valor.

## Instalacion

Instalar dependencias del backend:

```bash
cd Backend
npm install
```

Instalar dependencias del frontend:

```bash
cd Frontend
npm install
```

## Scripts principales

### Backend

```bash
npm run dev
```

Levanta la API con `nodemon`.

```bash
npm start
```

Levanta la API con Node.

### Frontend

```bash
npm run dev
```

Levanta Vite en modo desarrollo.

```bash
npm run build
```

Genera build de produccion.

```bash
npm run preview
```

Previsualiza el build.

## Base de datos

El repositorio incluye un dump listo para importar:

```text
database/init.sql
```

Importarlo en MySQL antes de levantar el backend:

```bash
mysql -u root -p -P 3307 < database/init.sql
```

El archivo crea la base `liga_basket`, sus tablas y los datos de prueba.

Si se modifican datos locales y se quiere regenerar el dump:

```bash
cd Backend
npm run db:export
```

## Ejecucion local

1. Levantar MySQL.
2. Importar `database/init.sql`.
3. Configurar `Backend/.env`.
4. Levantar backend:

```bash
cd Backend
npm run dev
```

5. Levantar frontend:

```bash
cd ../Frontend
npm run dev
```

6. Abrir la URL que indique Vite.

Nota: la base entregada ya debe incluir la estructura y los datos necesarios. Los scripts auxiliares de migracion y datos de prueba quedan en `Backend/scripts/`, pero no son parte del flujo normal de uso.

## Autenticacion

Las rutas publicas quedan abiertas para consulta. Las rutas administrativas requieren autenticacion con JWT.

El token se envia en el header:

```http
Authorization: Bearer <token>
```

### Login

```http
POST /auth/login
```

Body:

```json
{
  "username": "admin",
  "password": "password"
}
```

El backend:

1. Valida `username` y `password`.
2. Busca el administrador.
3. Compara la password con `bcrypt.compare`.
4. Genera un JWT con `jsonwebtoken`.
5. Devuelve `token` y datos basicos del admin.

Las passwords no se guardan en texto plano. Al crear un administrador se genera un hash con bcrypt y se guarda en `password_hash`.

## Rutas publicas

```http
GET /ligas
GET /ligas/:id
GET /ligas/:id/clasificacion
GET /ligas/:id/playoffs

GET /equipos
GET /equipos/:id

GET /jugadores
GET /jugadores/:id

GET /entrenadores
GET /entrenadores/:id

GET /partidos
GET /partidos/:id

GET /categorias
```

## Consumo de datos desde el frontend

El frontend carga los datos principales al iniciar la aplicacion:

- `GET /ligas`
- `GET /equipos`
- `GET /partidos`
- `GET /jugadores`
- `GET /entrenadores`
- `GET /categorias`

Con esa informacion arma las vistas publicas y aplica filtros del lado del cliente.

Ejemplos:

- En `Inicio`, `Fixture`, `Posiciones` y `Playoffs`, primero se cargan todos los partidos y luego se muestran los que pertenecen a la liga seleccionada.
- En `Equipos`, se muestran los equipos de la liga seleccionada.
- Al seleccionar un equipo se hace una request puntual a `GET /equipos/:id` para traer su ficha completa, entrenador, plantel y partidos asociados.
- En el panel admin se trabaja con los mismos listados cargados y, despues de crear/editar/borrar, se refrescan los datos publicos.

Esta decision simplifica la navegacion porque el volumen de datos del TPO es bajo. En una version productiva con muchos partidos convendria agregar filtros en backend, por ejemplo:

```http
GET /partidos?id_liga=17
GET /jugadores?id_equipo=156
```

Actualmente `GET /jugadores?id_equipo=...` ya soporta filtro por equipo, pero el frontend usa la carga general para mantener las vistas sincronizadas.

## Rutas privadas

Requieren header `Authorization: Bearer <token>`.

### Ligas

```http
POST /ligas
PUT /ligas/:id
DELETE /ligas/:id
```

### Equipos

```http
POST /equipos
PUT /equipos/:id
DELETE /equipos/:id
```

### Categorias

```http
POST /categorias
PUT /categorias/:id
DELETE /categorias/:id
```

### Jugadores

```http
POST /jugadores
PUT /jugadores/:id
DELETE /jugadores/:id
```

### Entrenadores

```http
POST /entrenadores
PUT /entrenadores/:id
DELETE /entrenadores/:id
```

### Partidos

```http
POST /partidos
PUT /partidos/:id
PATCH /partidos/:id/resultado
DELETE /partidos/:id
```

### Administradores

```http
GET /administradores
POST /administradores
```

### Playoffs

```http
POST /ligas/:id/playoffs/generar
POST /ligas/:id/playoffs/actualizar
```

## Bodies principales

### Liga

```json
{
  "nombre": "Liga Metropolitana de Basket - U19",
  "temporada_actual": "2026",
  "descripcion": "Torneo ida y vuelta de categoria U19.",
  "activa": true
}
```

### Entrenador

```json
{
  "nombre": "Juan",
  "apellido": "Perez"
}
```

### Equipo

```json
{
  "nombre": "Banfield U19",
  "categoria": "U19",
  "id_entrenador": 1,
  "descripcion": "DT BAN Juvenil U19",
  "escudo_url": "https://...",
  "activo": true,
  "id_liga": 1
}
```

### Categoria

```json
{
  "nombre": "U17",
  "descripcion": "Categoria juvenil U17",
  "activa": true
}
```

### Jugador

```json
{
  "nombre": "Martin",
  "apellido": "Gomez",
  "categoria": "U19",
  "id_equipo": 1
}
```

### Partido

```json
{
  "id_equipo_local": 1,
  "id_equipo_visitante": 2,
  "id_liga": 1,
  "numero_fecha": 7,
  "fecha": "2026-04-11",
  "horario": "20:00:00",
  "lugar": "Estadio BAN",
  "resultado_local": null,
  "resultado_visitante": null,
  "estado": "programado"
}
```

### Resultado de partido

```json
{
  "resultado_local": 71,
  "resultado_visitante": 54
}
```

## Clasificacion

La clasificacion se calcula automaticamente por liga usando solo partidos de fase regular.

Puntaje:

- Partido ganado: 3 puntos.
- Partido empatado: 1 punto.
- Partido perdido: 0 puntos.

Desempates:

1. Puntos.
2. Diferencia de tantos.
3. Tantos a favor.
4. Nombre del equipo.

La tabla muestra:

- Posicion.
- Equipo.
- PJ.
- PG.
- PE.
- PP.
- PF.
- PC.
- Diferencia.
- Puntos.

## Numero de fecha

Cada partido tiene `numero_fecha`. Esto permite que cada liga/categoria avance de manera independiente.

Ejemplo:

```text
U17 puede estar en fecha 18
U19 puede estar en fecha 7
Primera puede estar en fecha 4
```

La API calcula `fecha_actual` por liga:

- Si hay partidos pendientes, usa la menor `numero_fecha` pendiente.
- Si no hay pendientes, usa la mayor `numero_fecha` jugada.

El fixture publico agrupa por `numero_fecha`, no solamente por dia calendario.

## Playoffs

Los playoffs son por liga.

Formato implementado:

- Clasifican los primeros 4 de la tabla regular.
- Semifinales:
  - 1 vs 4.
  - 2 vs 3.
- Partido unico.
- El mejor clasificado juega de local.
- La final se genera con los ganadores de semifinales.
- En la final, la localia queda para el finalista con mejor seed regular.

Flujo:

1. Generar playoffs desde la vista Playoffs o endpoint privado.
2. Cargar resultados de semifinales desde admin.
3. Actualizar playoffs.
4. Se genera la final.
5. Cargar resultado de la final.
6. Actualizar playoffs.

## Vista publica

Los usuarios invitados pueden:

- Ver inicio con tabla principal, ultimos resultados, proximos partidos y calendario.
- Consultar equipos, entrenadores y planteles.
- Consultar fixture agrupado por numero de fecha.
- Consultar posiciones.
- Consultar playoffs.

No pueden modificar datos.

## Panel admin

El administrador puede:

- Iniciar sesion.
- Crear, editar y eliminar ligas.
- Crear, editar y eliminar equipos.
- Crear, editar y eliminar jugadores.
- Crear, editar y eliminar entrenadores.
- Crear, editar y eliminar partidos.
- Cargar resultados.
- Crear otros administradores.
- Generar y actualizar playoffs.

## Validaciones implementadas

- Login requiere usuario y password.
- Passwords de administradores se guardan con bcrypt.
- Rutas privadas protegidas con middleware JWT.
- Partido no puede tener el mismo equipo como local y visitante.
- Equipo local y visitante deben existir y pertenecer a la liga indicada.
- Resultados deben cargarse completos: local y visitante juntos.
- Resultados deben ser numeros enteros no negativos.
- `numero_fecha` debe ser entero positivo.
- No se elimina una liga que tenga equipos asociados.

