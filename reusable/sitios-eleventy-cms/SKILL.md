---
name: sitios-eleventy-cms
description: Crear o mantener sitios corporativos replicables con Eleventy, Nunjucks y Decap CMS, aplicando aprendizajes de Viex Salud. Usar al reutilizar esta base o configurar su contenido editable; no migrar otros proyectos a esta arquitectura sin solicitud.
---

# Sitios corporativos con CMS

## Alcance

Separar estructura, contenido y configuración de cada marca. Conservar la arquitectura del proyecto existente. Esta base no es un sitio completo ni una integración OAuth ya operativa: incluye un contrato de contenido y configuración CMS adaptables.

Antes de trabajar, leer package.json, configuración de Eleventy, configuración de despliegue y CMS y el estado breve del proyecto. Resolver los nombres reales y preservar cambios existentes.

## Reutilización

- Para un sitio nuevo, leer [el contrato CMS](references/cms.md) y adaptar `assets/cms/config.yml`, `assets/cms/site.json` y `assets/cms/admin-index.html`. Copiar solo a destinos nuevos o aplicar diferencias revisadas. Conectar los campos a las plantillas: un campo CMS sin consumidor no modifica el sitio.
- Para mantenimiento o validación, leer [aprendizajes y pruebas](references/aprendizajes.md).
- Configurar por proyecto dominio, repositorio, rama, OAuth, contactos, redes, identidad, analítica y proveedores. No copiar cuentas, IDs de medición, credenciales, testimonios, datos de clientes ni información de salud de Viex Salud.
- No agregar pagos, IA de pago, redes automáticas ni migrar DNS como consecuencia implícita de usar esta skill. Solicitar la elección o autorización específica cuando corresponda.

## Criterios de entrega

Mantener Inicio, Nosotros, Servicios/Planes, Blog y Contacto como secciones adaptables al negocio. No inventar precios, ofertas, resultados ni historial comercial. Reutilizar estilos de marca y probar navegación en móvil, tablet y escritorio.

Validar CMS de extremo a extremo: autenticación, creación de dos entradas distintas, persistencia de ambas, imagen, edición, publicación y recuperación de una eliminación de prueba. Hacerlo con contenido de prueba autorizado, sin borrar contenido real. Identificadores estables; no asumir que el título es único.

Preservar imágenes originales y generar variantes optimizadas. Mantener sitemap de páginas públicas y contenido indexable. No prometer primera posición en Google o IA.

Informar explícitamente qué quedó local, en preview o publicado y qué requiere acceso/verificación. Actualizar `docs/estado-desarrollo.md` con evidencias, pendientes y rutas, sin secretos. Guardar nuevos aprendizajes solo tras reproducirlos, sin convertir peculiaridades de un cliente en reglas universales.
