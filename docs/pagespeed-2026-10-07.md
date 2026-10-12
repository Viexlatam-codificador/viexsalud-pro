# Correcciones móviles — 7 octubre 2026

Informe del usuario: https://pagespeed.web.dev/analysis/https-www-viexsalud-cl/1w57au837t?form_factor=mobile
Resultados de origen: rendimiento móvil 76, accesibilidad 92, buenas prácticas 92, SEO 100, LCP 7,7 s. No son mediciones posteriores a estos cambios.

Correcciones locales: Tawk no carga hasta 900px; al reducir una ventana ya cargada se oculta/minimiza; cerrar menú no lo reactiva en móvil. WhatsApp conserva enlace directo a wa.me y usa icono vectorial 28px dentro de botón 52px, zona segura inferior y ocultación con menú abierto. No se altera interfaz de WhatsApp externa. No hay atribución visual definitiva del popup denunciado: Tawk es el candidato identificado en código e informe.

Scripts GTM, Contentsquare y Tawk dejan de bloquear parseo por defer. Logos raster de Isapres se reducen a máximo 360px conservando originales. Mejora contraste en etiquetas, tarjetas y autores, nombre accesible del CTA móvil y jerarquía de encabezados del pie.

Pendientes: prueba visual real y nueva medición, duplicación de GA con GTM (el informe muestra gtag doble), revisión de Contentsquare/CSP y Supabase inline de portada. No se relajó CSP ni se eliminaron etiquetas de campañas sin revisar configuración. npm ci reporta 10 vulnerabilidades (5 moderadas/5 altas); no se aplicó actualización forzada.

Repositorio recuperado desde GitHub porque la ruta anterior no existe en el equipo. Base 8542a56. No incluye comparador local sin publicar de otras sesiones. Cambios NO publicados.
