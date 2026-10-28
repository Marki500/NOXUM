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
- `scripts/build-site.mjs`: prepara `dist/`, copia fuentes con su licencia y empaqueta el 3D y las animaciones con esbuild.
- `npm run check`: verifica enlaces locales, metadatos y estructura de las páginas compiladas.

Publicar únicamente el contenido de `dist/` en un alojamiento estático con HTTPS. Configurar `404.html` como página de error manteniendo el estado HTTP 404. Las carpetas deben servir su `index.html` y las URLs públicas deben conservar la barra final.

El dominio configurado es `https://noxumlab.com`. Si cambia, modificar `content/site.js` y volver a compilar antes de publicar. No desplegar el servidor de desarrollo como servidor público.

## Contacto y medición

El formulario prepara un enlace `mailto:` a `info@noxumlab.com` y ofrece copiar el resumen. No envía mensajes desde un servidor ni guarda datos. El buzón debe existir para recibir consultas.

No hay analítica, cookies de seguimiento ni conexión a Search Console. Tras publicar y verificar la propiedad en GSC, enviar `https://noxumlab.com/sitemap.xml` y comprobar las URLs públicas con la herramienta de inspección.
