# Estado SEO — 2026-10-16

Preparado sobre main 84dfa9024697cc7921f028529ea6b6482c69782a. Publicación pendiente de verificar en Vercel.

Cambios: portada con servicio explícito; página /asesoria-isapre enlazada desde navegación y artículos; guía principal de cambio reescrita con requisitos, comparación y fuentes de la Superintendencia consultadas el 16 de octubre; sitemap generado único y URLs sin barra final (excepto raíz), alineadas con canónicas; JSON-LD de artículos escapado mediante toJSON. Se conservan CMS, formularios y configuración Supabase.

Validación: npm test (build Eleventy y controles existentes); 14 URLs públicas únicas con archivo generado, canonical coincidente, un H1 y JSON-LD válido. Imágenes de la copia local anterior usadas solo para compilar; no se incluyen modificaciones de imágenes en GitHub. No se pudo iniciar servidor local por restricciones del entorno; revisión visual móvil/tablet/escritorio pendiente en preview Vercel. No se enviaron formularios ni correos de prueba.

Siguiente paso: confirmar despliegue, revisar visualmente portada y /asesoria-isapre, enviar sitemap y solicitar indexación desde Search Console. Medir consultas, clics y aperturas de WhatsApp, sin equiparar apertura con contacto recibido. No hay garantía de posiciones ni de citas por IA.

## Registro anterior — 2026-09-27

Rama: feature/mejoras-sitio-2026-09-27. Cambios locales, no publicados todavía.

Implementado: navegación compartida; Nosotros y líneas de asesoría editables en Decap; contacto validado con consentimiento y continuación explícita en WhatsApp; portada con tres artículos recientes; sitemap dinámico; variantes WebP automáticas conservando originales; protección de navegación móvil y ocultación del chat al abrir menú; medición de apertura de WhatsApp sin afirmar recepción de lead; exclusión de loaders de seguimiento/chat en local y recursos internos. No se migró arquitectura ni contenido ejecutivo.

Verificación: HTTPS público responde 200 y conserva CSP/HSTS. Build y checks estructurales; prueba manual de menú en pantalla estrecha. npm audit fix compatible aplicado (0 vulnerabilidades reportadas). No equivale a auditoría integral.

Pendiente: revisión visual escritorio/tablet; prueba de envío real y recepción de contacto; confirmar eventos GA4 en cuenta y duplicaciones con GTM; consentimiento y configuración de session replay en público; auditoría de autorización real de recursos ejecutivos; migración Zoho (no se cambió DNS ni se confirmó buzón); fotografías representativas autorizadas y planes comerciales concretos con vigencia. No publicar correo corporativo como operativo antes de probarlo.

Archivos: src/_data/services.json; includes public-navigation/service-sections/contact-section; admin/config.yml; src/assets/script.js/styles.css; scripts/image-transform.cjs; src/sitemap.njk. El formulario sigue usando WhatsApp, no almacenamiento/backend de leads.

Reutilización: `reusable/sitios-eleventy-cms/` contiene skill, aprendizajes y plantilla CMS genérica sin credenciales ni IDs de Viex. No sustituye el admin actual ni constituye un sitio completo desplegado. Adaptar y conectar sus campos según `references/cms.md` antes de usar en otra marca.
