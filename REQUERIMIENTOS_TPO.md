# Checklist de requerimientos TPO API 1C 2026

Documento de seguimiento para verificar cumplimiento del enunciado.

## Requerimientos generales

- [x] Aplicacion web con React, JavaScript, HTML/CSS y NodeJS.
- [x] Base de datos SQL/MySQL.
- [x] Codigo frontend modularizado por vistas.
- [x] Responsive completo en mobile, tablet y desktop.
- [ ] Documentacion final de instalacion, configuracion, credenciales y uso.

## Landing / vista publica

- [x] Nombre de la liga visible.
- [x] Temporada actual visible.
- [x] Acceso a clasificacion.
- [x] Acceso a calendario/fixture.
- [x] Acceso a detalle de equipos.
- [x] Acceso diferenciado para administradores.
- [ ] Revisar que la descripcion breve de liga quede disponible sin redundancia.
- [x] Validar UX responsive final.

## Gestion de equipos

- [x] Alta de equipos desde admin.
- [x] Edicion de equipos desde admin.
- [x] Eliminacion de equipos desde admin.
- [x] Categoria de equipo seleccionable desde dropdown administrable.
- [x] Asociacion de entrenador.
- [x] Asociacion/listado de jugadores.
- [x] Vista publica de equipo con entrenador y plantel.
- [x] Estadisticas acumuladas visibles en posiciones.
- [ ] Confirmar que la vista por equipo cumpla con partidos jugados, pendientes y resultados segun enunciado. Actualmente esa informacion se movio a Posiciones para evitar redundancia.

## Gestion de jugadores

- [x] Alta de jugadores desde admin.
- [x] Edicion de jugadores desde admin.
- [x] Eliminacion de jugadores desde admin.
- [x] Nombre y apellido.
- [x] Categoria.
- [x] Categoria seleccionable desde dropdown administrable.
- [x] Asociacion a equipo.

## Gestion de categorias

- [x] Alta de categorias desde admin.
- [x] Edicion de categorias desde admin.
- [x] Eliminacion protegida si la categoria esta en uso.
- [x] Categorias usadas como fuente para dropdowns de equipos y jugadores.

## Gestion de entrenadores

- [x] Alta de entrenadores desde admin.
- [x] Edicion de entrenadores desde admin.
- [x] Eliminacion de entrenadores desde admin.
- [x] Asociacion con equipos.

## Gestion de partidos

- [x] Crear partidos con local, visitante, fecha, horario y lugar.
- [x] Editar partidos.
- [x] Eliminar partidos.
- [x] Cargar resultado local y visitante.
- [x] Fixture publico agrupado por fecha.
- [x] Resultados publicos.
- [x] Validacion de backend para evitar local igual a visitante.
- [ ] Revisar validaciones de estadio/lugar.
- [x] Modelar numero de fecha/jornada por liga y por partido.
- [x] Calcular fecha actual por liga desde partidos pendientes/jugados.

## Reglas de puntuacion y clasificacion

- [x] Clasificacion automatica.
- [x] La clasificacion cuenta solo fase regular.
- [x] Partido ganado: 3 puntos.
- [x] Partido empatado: 1 punto.
- [x] Partido perdido: 0 puntos.
- [x] Desempate por diferencia de tantos.
- [x] Segundo desempate por tantos a favor.
- [x] Tabla muestra posicion, equipo, puntos, PJ, PG, PE, PP, PF, PC y diferencia.
- [x] Vista avanzada de posiciones con forma reciente y local/visitante.

## Playoffs

- [x] Clasifican los primeros 4 de la tabla regular.
- [x] Semifinales automaticas: 1 vs 4 y 2 vs 3.
- [x] Partido unico.
- [x] El mejor clasificado juega de local.
- [x] Final automatica con ganadores de semifinales.
- [x] La localia de la final queda para el finalista con mejor seed regular.
- [x] Vista publica de cuadro de playoffs.
- [x] Acciones admin para generar y actualizar playoffs.
- [x] Migracion `npm run setup:playoffs` corrida en base real.
- [ ] Probar flujo completo de playoffs con carga de resultados desde admin.

## Area administrativa

- [x] Login administrador.
- [x] Usuarios publicos no tienen modificacion.
- [x] Gestion de equipos.
- [x] Gestion de jugadores.
- [x] Gestion de entrenadores.
- [x] Gestion de partidos.
- [x] Carga de resultados.
- [ ] Confirmar cifrado de contrasena de administrador en backend.
- [ ] Confirmar proteccion de rutas privadas del backend.
- [ ] Confirmar validaciones frontend/backend en todos los formularios.
- [ ] Preparar credenciales de prueba para entrega.

## Vista publica

- [x] Ver clasificacion general.
- [x] Consultar calendario de partidos.
- [x] Ver detalle de cada equipo.
- [x] Consultar resultados.
- [x] Sin permisos de modificacion.

## No funcionales

- [x] Separacion inicial de componentes/vistas.
- [x] Reutilizacion de componentes compartidos.
- [x] Responsive final.
- [ ] Revision de performance en cargas/listados.
- [ ] Revision de compatibilidad navegadores.
- [ ] Documentacion tecnica y manual de usuario.

## Prioridades pendientes

1. Probar visualmente numero de fecha por liga cargando/actualizando partidos desde admin.
2. Probar flujo completo de playoffs con carga de resultados desde admin.
3. Auditar seguridad: hash de password, middleware, rutas privadas.
4. Auditar validaciones frontend/backend.
5. Preparar documentacion de entrega.
6. Revisar requisito de vista por equipo versus decisiones actuales de UX.
