export const articles = [{
  slug: 'vulnerabilidades-criticas-php-revisar-web',
  title: 'Fallo crítico en PHP: qué revisar en tu web | Noxum Lab',
  headline: 'Fallo crítico en PHP: qué revisar en tu web',
  heading: 'Fallo crítico en PHP.',
  description: 'Qué comprobar tras las vulnerabilidades críticas de PHP de octubre de 2026: parches, alojamiento y compatibilidad. Cuándo actualizar y cuándo renovar tu web.',
  category: 'Mantenimiento web',
  published: '2026-10-29',
  modified: '2026-10-29',
  lead: 'Qué significa la alerta para tu negocio, qué preguntarle al alojamiento y cuándo tiene sentido plantear una renovación.',
  summary: 'PHP ha publicado parches para dos vulnerabilidades críticas. El primer paso es confirmar que el servidor está protegido y revisar la compatibilidad de la web.',
  sections: [
    {id:'que-ha-pasado', heading:'Qué ha ocurrido.', paragraphs:[
      'El 21 de octubre de 2026, el equipo de PHP anunció correcciones para CVE-2026-109618 y CVE-2026-109619. Son dos vulnerabilidades críticas que pueden permitir ejecutar código en servidores afectados sin autenticación.',
      'El aviso comprende instalaciones de PHP que atienden peticiones web y señala un riesgo mayor en Apache con mod_php. PHP publicó las versiones 8.2.35, 8.3.36, 8.4.27 y 8.5.12 con las correcciones. En Linux, el proveedor puede incorporar los parches a sus propios paquetes: el número de versión visible, por sí solo, no confirma si el servidor está protegido.'
    ]},
    {id:'que-revisar', heading:'Qué revisar en tu web.', paragraphs:[
      'Si gestionas un negocio, puedes empezar enviando estas preguntas a quien administra tu alojamiento. No necesitas cambiar ajustes del servidor por tu cuenta.'
    ],items:[
      ['PHP y parches','¿Qué versión utiliza esta web y se han aplicado las correcciones para ambas vulnerabilidades? Pide confirmación del paquete instalado y de los procesos que sirven la web.'],
      ['Compatibilidad','¿La aplicación, sus extensiones y su código propio funcionan con la actualización prevista? Conviene preparar las pruebas en un entorno separado cuando sea posible.'],
      ['Copias y recuperación','¿Hay una copia reciente de los archivos y de la base de datos? Comprueba quién puede restaurarla y cómo se verificará la recuperación.'],
      ['Funciones importantes','Después de actualizar, revisa acceso, formularios, búsquedas, cargas de archivos y compra, si la web tiene tienda. Haz la lista a partir de lo que usa tu negocio.']
    ]},
    {id:'wordpress-y-alojamiento', heading:'Si utilizas WordPress.', paragraphs:[
      'Actualizar WordPress, un tema o un plugin no demuestra que PHP también se haya actualizado: PHP se ejecuta en el servidor y su mantenimiento debe comprobarse con quien lo administra.',
      'El aviso de PHP incluye medidas temporales y aclaraciones posteriores. Estas medidas no sustituyen la actualización. Confirma con tu proveedor qué indicaciones se aplican a su entorno, especialmente si no puede parchearlo de inmediato.'
    ]},
    {id:'actualizar-o-renovar', heading:'¿Actualizar o renovar la web?', paragraphs:[
      'Si la web cumple su función y su código es compatible, una actualización con las pruebas correspondientes puede ser suficiente. El trabajo se concentra en mantener lo que ya tienes.',
      'Una renovación merece estudiarse cuando cada actualización se bloquea por dependencias abandonadas, el código es difícil de mantener o la web ya no cubre las necesidades del negocio. También puede hacerse por partes: sustituir una integración, reconstruir una sección o mejorar un recorrido.',
      'Antes de presupuestar, separaría la corrección necesaria para proteger el servidor de las mejoras de diseño y funcionalidad. Así puedes decidir qué resolver ahora y qué planificar después.'
    ]},
    {id:'mantenimiento', heading:'Dejar acordado el mantenimiento.', paragraphs:[
      'Un mantenimiento útil deja claro quién revisa los avisos, quién actualiza, qué copias existen y cómo se comprueba la web después de un cambio. También concreta horarios, canales de contacto y el trabajo incluido.',
      'En Noxum Lab puedo revisar el estado de tu proyecto y proponerte una intervención con un alcance definido. Puede ser un arreglo puntual, mantenimiento continuado o una renovación si el diagnóstico la justifica.'
    ]}
  ],
  sources:[
    ['Avisos oficiales de PHP de octubre de 2026', 'https://www.php.net/archive/2026.php'],
    ['CVE-2026-109618: aviso técnico del proyecto PHP', 'https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w'],
    ['CVE-2026-109619: aviso técnico y actualizaciones del proyecto PHP', 'https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp']
  ]
}];
