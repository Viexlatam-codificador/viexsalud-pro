/* Crea el cliente de Supabase en un archivo propio.
   Antes estaba en un <script> en línea y la política de seguridad (CSP,
   script-src sin 'unsafe-inline') lo bloqueaba: window.VIEX_SUPABASE quedaba
   sin definir y los formularios no guardaban nada en la base de datos. */
(function () {
  try {
    if (!window.supabase || !window.supabase.createClient) return;
    window.VIEX_SUPABASE = window.supabase.createClient(
      "https://jniaoqcgpdryqrssntfp.supabase.co",
      "sb_publishable_BCFzQF1HZw8EPsGsdNvXCQ_0ILWpQB6"
    );
  } catch (err) { /* nunca romper la página */ }
})();
