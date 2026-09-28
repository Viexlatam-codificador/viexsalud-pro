# Contrato de contenido editable

La plantilla es un punto de partida, no un CMS desplegado. Adaptar repositorio y URL antes de usarla. `admin-index.html` va en `admin/index.html`; `config.yml` en `admin/config.yml`; `site.json` en `src/_data/site.json`. Eleventy debe copiar `admin` y `src/assets` al resultado. Las plantillas consumen `site.*`; los artículos necesitan layout y permalink, preferiblemente definidos mediante datos de directorio.

## Campos y consumidores

| Colección/campo | Destino visible |
| --- | --- |
| sitio / brandName, logo | Cabecera y pie |
| sitio / hero.title, hero.description, hero.image | Portada |
| sitio / about, mission, values | Nosotros |
| sitio / services | Tarjetas de servicios y enlaces de consulta |
| sitio / contact | Teléfono, correo confirmado y WhatsApp |
| sitio / social | Enlaces a redes, no publicación automática |
| blog / title, description, date, cover, coverAlt, body | Listado, artículo, metadatos y portada |

Escapar contenido de texto y atributos; validar URLs (https para enlaces externos) antes de publicarlas. Nunca usar campos editables como HTML/JS arbitrario. Campos vacíos opcionales no deben producir imágenes rotas ni enlaces vacíos.

Configurar GitHub OAuth del dominio nuevo y sus secretos solo en servidor. La plantilla no incluye el proveedor OAuth. Probar callback y origen exacto con/sin www. La autorización editorial de Decap no sustituye autorización servidor de herramientas privadas.

La colección blog usa un identificador temporal con precisión de segundos más slug. Para importación masiva o escrituras concurrentes implementar un ID inmutable/UUID y comprobar colisiones antes de guardar; no sobrescribir documentos al coincidir nombres. Para bases de conocimiento usar ID estable, categoría/referencia, fecha de creación y actualización, filtros y orden alfabético. No trasladar datos médicos de un cliente a otro sitio.

Para una instalación existente conservar nombres y rutas de colecciones; no reemplazar su config con esta plantilla. En Viex Salud ya existen `sitio`, `blog`, `preexistencias` e `isapres`: esta plantilla genérica NO sustituye esas colecciones.

Editar contenido no significa que esté publicado: distinguir borrador, revisión, publicación Git y despliegue exitoso. Mantener posibilidad de recuperación mediante historial y pruebas de restauración.
