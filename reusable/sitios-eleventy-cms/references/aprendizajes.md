# Aprendizajes comprobados y límites

- Con URL `/admin` sin barra, Decap puede pedir `/config.yml` incorrectamente. Usar `<base href="/admin/">` o ruta absoluta de configuración y comprobar respuesta 200.
- Una ventana OAuth que se cierra no prueba login. Verificar callback, intercambio y handshake, origen exacto y CSP de la respuesta. No relajar CSP globalmente para arreglar una ruta.
- Decap puede necesitar `blob:` tanto en `img-src` como en `connect-src` para medios y borradores. Revisar error de consola y headers reales; restringir excepciones al administrador y dependencias necesarias.
- Los identificadores de proveedor se copian de texto, no se transcriben de capturas (O y 0 pueden confundirse).
- Mostrar imagen en el editor no prueba su presencia en producción. Validar ruta guardada, archivo versionado, despliegue, artículo y tarjeta del listado.
- No sustituir una lista completa por una sola entrada. Comprobar dos altas consecutivas, edición individual y conservación del resto. Borrado masivo requiere selección visible, confirmación y recuperación.
- Menú móvil: comprobar capas, desplazamiento, foco, Escape y chat flotante; probar también cuando el widget termina de cargar después de abrir el menú.
- Formularios: validación accesible y consentimiento explícito; no capturar datos sensibles innecesarios. Abrir WhatsApp no equivale a un lead recibido: etiquetar medición acorde y probar envío/recepción por separado.
- Evitar seguimiento, chat y grabación de sesiones en admin, áreas privadas y previews. En público revisar consentimiento, enmascaramiento y duplicación GA/GTM antes de certificar privacidad o medición.
- Ocultar HTML por JavaScript o añadir noindex no protege datos privados. Acceso real requiere autorización en servidor/datos; evaluar esa arquitectura por separado.
- SSL/HSTS y audit de dependencias no equivalen a una auditoría integral. No describir el sitio como completamente seguro.
- DNS/correo: registrar dominio no crea buzón. Verificar proveedor actual, TXT, MX, SPF único, DKIM, DMARC y recepción/envío antes de migrar; no eliminar registros existentes por suposición.

## Evidencia mínima

Build y rutas sin errores; imágenes sin 404; CMS y plantillas alineados; revisión visual al menos 360, 768 y 1440 px; navegación teclado y movimiento reducido; formulario inválido/válido; no datos personales en eventos; TLS y headers de dominio real; confirmación de despliegue antes de afirmar publicado. Marcar pruebas no realizadas, no inferirlas de una compilación.

## Estado de origen

Aprendizajes extraídos de Viex Salud, septiembre 2026. Las mejoras de navegación, imágenes y secciones del 27 de septiembre eran locales al crear esta skill. No asumir que GA, correo, privacidad o CMS de producción quedaron completamente verificados. Consultar estado y evidencia actual del proyecto.
