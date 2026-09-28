# Estado — 2026-09-27

Rama: feature/mejoras-sitio-2026-09-27. Cambios locales, no publicados todavía.

Implementado: navegación compartida; Nosotros y líneas de asesoría editables en Decap; contacto validado con consentimiento y continuación explícita en WhatsApp; portada con tres artículos recientes; sitemap dinámico; variantes WebP automáticas conservando originales; protección de navegación móvil y ocultación del chat al abrir menú; medición de apertura de WhatsApp sin afirmar recepción de lead; exclusión de loaders de seguimiento/chat en local y recursos internos. No se migró arquitectura ni contenido ejecutivo.

Verificación: HTTPS público responde 200 y conserva CSP/HSTS. Build y checks estructurales; prueba manual de menú en pantalla estrecha. npm audit fix compatible aplicado (0 vulnerabilidades reportadas). No equivale a auditoría integral.

Pendiente: revisión visual escritorio/tablet; prueba de envío real y recepción de contacto; confirmar eventos GA4 en cuenta y duplicaciones con GTM; consentimiento y configuración de session replay en público; auditoría de autorización real de recursos ejecutivos; migración Zoho (no se cambió DNS ni se confirmó buzón); fotografías representativas autorizadas y planes comerciales concretos con vigencia. No publicar correo corporativo como operativo antes de probarlo.

Archivos: src/_data/services.json; includes public-navigation/service-sections/contact-section; admin/config.yml; src/assets/script.js/styles.css; scripts/image-transform.cjs; src/sitemap.njk. El formulario sigue usando WhatsApp, no almacenamiento/backend de leads.

Reutilización: `reusable/sitios-eleventy-cms/` contiene skill, aprendizajes y plantilla CMS genérica sin credenciales ni IDs de Viex. No sustituye el admin actual ni constituye un sitio completo desplegado. Adaptar y conectar sus campos según `references/cms.md` antes de usar en otra marca.
