# Noxum Lab

Web estática con páginas de servicio y proyectos. La portada conserva la pieza 3D interactiva.

```sh
npm install
npm run build
npm run check
npm run dev
```

La vista previa se abre en `http://127.0.0.1:4173`. El servidor local envía `X-Robots-Tag: noindex, nofollow`; es solo para desarrollo.

## Contenido y publicación

- `content/site.js`: dominio público, correo, servicios y casos de proyecto.
- `index.html`: portada. El bloque `seo:start` y el pie se actualizan al compilar.
- `scripts/build-content.mjs`: genera páginas HTML, metadatos, JSON-LD, robots.txt y sitemap.
- `motion.js` y `motion.css`: tipografías locales Anton y Manrope, portada de composición gráfica, transiciones de navegación y escenas de proyectos con GSAP. El acercamiento de portada y el apilado se activan en escritorio con puntero preciso; se respeta la preferencia de movimiento reducido.
- `site-loader.js`: carga progresiva; el texto y la imagen inicial se muestran antes de arrancar los efectos. El 3D sigue siendo automático en móvil y escritorio, salvo preferencia de movimiento reducido o ahorro de datos.
- `sculpture.js` y `sculpture-worker.js`: el control accesible vive en la página; Three.js, los reflejos, la geometría y el renderizado viven en un worker con OffscreenCanvas. Límite de 24 FPS en móvil y 30 FPS en escritorio, resolución limitada y ajuste por coste de renderizado. Se pausa fuera de pantalla y al ocultar la pestaña. `sculpture-main.js` conserva compatibilidad con navegadores sin OffscreenCanvas.
- `scripts/build-site.mjs`: prepara `dist/`, copia fuentes con su licencia, genera WebP de varios tamaños y empaqueta CSS/JS con nombres que contienen un hash. GSAP solo se descarga en escritorio; los enlaces y la navegación nativa funcionan en todos los tamaños.
- `Dockerfile`: compilación en Node 24 y servidor estático Nginx. En Coolify, usar **Build strategy: Dockerfile**, directorio base `/`, archivo `/Dockerfile` y puerto `80`. Compila y ejecuta las comprobaciones antes de construir la imagen final.
- `nginx.conf`: configuración de producción incluida en la imagen Docker, con gzip, caché para los recursos versionados y errores 404 reales.
- `npm run check`: verifica enlaces locales, metadatos, estructura, referencias entre módulos y presupuesto del JavaScript inicial.

Publicar únicamente el contenido de `dist/` en un alojamiento estático con HTTPS. Configurar `404.html` como página de error manteniendo el estado HTTP 404. Las carpetas deben servir su `index.html` y las URLs públicas deben conservar la barra final.

El dominio configurado es `https://noxumlab.com`. Si cambia, modificar `content/site.js` y volver a compilar antes de publicar. No desplegar el servidor de desarrollo como servidor público.

## Contacto y medición

El formulario prepara un enlace `mailto:` a `info@noxumlab.com` y ofrece copiar el resumen. No envía mensajes desde un servidor ni guarda datos. El buzón debe existir para recibir consultas.

No hay analítica, cookies de seguimiento ni conexión a Search Console. Tras publicar y verificar la propiedad en GSC, enviar `https://noxumlab.com/sitemap.xml` y comprobar las URLs públicas con la herramienta de inspección.
