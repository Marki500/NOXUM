export const articles = [{
  slug: 'vulnerabilidades-criticas-php-revisar-web',
  title: 'Fallo crítico en PHP: qué revisar en tu web | Noxum Lab',
  headline: 'Fallo crítico en PHP: qué revisar en tu web',
  heading: 'Fallo crítico en PHP.',
  breadcrumb: 'Fallo crítico en PHP',
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
    {id:'actualizar-o-renovar', heading:'¿Actualizar o renovar la web?', links:[['Ver las señales para decidir si renovar tu web','/blog/actualizar-o-renovar-web/']], paragraphs:[
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
}, {
  slug: 'actualizar-o-renovar-web',
  title: '¿Actualizar o renovar tu web? Señales para decidir | Noxum Lab',
  headline: '¿Actualizar o renovar tu web? Señales para tomar la decisión',
  heading: '¿Actualizar o renovar tu web?',
  breadcrumb: 'Actualizar o renovar tu web',
  description: 'Cómo decidir si tu web necesita una actualización, mejoras puntuales o un rediseño completo. Señales, ejemplos y qué revisar antes de pedir presupuesto.',
  category: 'Desarrollo web',
  published: '2026-10-29',
  modified: '2026-10-29',
  lead: 'Si tu web te frena cada vez que quieres cambiar algo, merece una revisión. Estas son las preguntas que haría antes de proponer una web nueva.',
  summary: 'Actualizar, mejorar por partes o empezar de nuevo. La decisión depende de cómo funciona tu web, de lo que necesitas y de si puedes seguir manteniéndola.',
  form: 'Diseño y desarrollo web',
  cta: '¿Qué necesita tu web?',
  sourcesNote: 'Los criterios de esta guía son una orientación para estudiar cada proyecto. El aviso de PHP se cita como contexto y tiene su propia información de seguridad actualizada.',
  sections: [
    {id:'alerta-y-decision', heading:'Una alerta es motivo para revisar.', paragraphs:[
      'El aviso de seguridad publicado por PHP el 21 de octubre de 2026 recomienda actualizar las instalaciones afectadas. Esa actuación corresponde al mantenimiento del servidor; por sí sola, no determina que haya que reconstruir la web.',
      'La pregunta de fondo es otra: ¿puedes mantener tu web al día sin que cada cambio se convierta en un problema? Si la respuesta es difícil de concretar, empezaría por revisar su estado antes de decidir una renovación.'
    ],links:[['Qué comprobar tras la alerta de PHP','/blog/vulnerabilidades-criticas-php-revisar-web/']]},
    {id:'cuando-actualizar', heading:'Cuándo basta con actualizar.', paragraphs:[
      'Si la web sigue explicando bien tu negocio, permite hacer lo que necesitan tus clientes y admite las actualizaciones previstas, puede bastar con mantenerla. Conviene comprobar compatibilidad, copias y funciones importantes antes y después de los cambios.',
      'Por ejemplo: una web de servicios con contenidos vigentes y un formulario que funciona no necesita un rediseño completo solo porque toque actualizar PHP. Si las pruebas y la revisión técnica lo permiten, el trabajo puede limitarse a esa actualización.'
    ]},
    {id:'mejorar-por-partes', heading:'Cuándo mejorar por partes.', paragraphs:[
      'A veces el problema tiene una ubicación concreta: el formulario pide demasiados datos, una página no explica un servicio o el menú cuesta de usar en móvil. En esos casos estudiaría una intervención delimitada y cómo comprobar su resultado.',
      'También puedes necesitar una función nueva sin cambiar toda la web: reservas, un catálogo, una conexión con tu herramienta de gestión o una sección de proyectos. Primero hay que revisar si la base actual permite incorporarla y mantenerla después.'
    ],links:[['Consultar cambios y mejoras web','/servicios/cambios-y-mejoras-web/']]},
    {id:'senales-para-renovar', heading:'Señales para plantear una renovación.', paragraphs:[
      'Una web nueva empieza a tener sentido cuando los problemas afectan al conjunto y los arreglos aislados dejan de resolver lo que necesitas. Estas señales servirían para iniciar esa conversación; ninguna sustituye una revisión del proyecto.'
    ],items:[
      ['Cada actualización se bloquea','La web depende de componentes abandonados o de código que nadie puede mantener con claridad. Pide identificar qué impide actualizar y qué opciones existen para sustituirlo.'],
      ['Tu negocio ha cambiado','Ofreces otros servicios, vendes de otra manera o te diriges a otros clientes, pero la estructura y los contenidos siguen explicando una etapa anterior.'],
      ['Las tareas importantes resultan difíciles','Pedir presupuesto, encontrar un producto o contactar cuesta en varias partes de la web. Revisa esos recorridos con ejemplos reales antes de decidir el alcance.'],
      ['Añadir funciones exige rehacer la base','Las necesidades previstas no encajan bien en la estructura actual. Conviene comparar una adaptación con una reconstrucción, incluyendo el mantenimiento posterior.']
    ]},
    {id:'antes-del-presupuesto', heading:'Qué revisar antes del presupuesto.', paragraphs:[
      'Prepararía una lista de lo que funciona, de lo que falla y de lo que necesitas incorporar. Con la dirección de la web, ejemplos concretos y los accesos que se acuerden, podemos estudiar qué conservar y qué cambiar.',
      'El presupuesto debería explicar las páginas y funciones incluidas, los contenidos que hay que preparar, las pruebas, la puesta en marcha y el soporte posterior. Si cambiamos direcciones, también hay que planificar cómo llevar al visitante desde las antiguas a las nuevas. Antes de retirar la web anterior, conviene dejar una copia y acordar cómo volver atrás si surge un problema.'
    ]},
    {id:'siguiente-paso', heading:'Empezamos por tu web actual.', paragraphs:[
      'En Noxum Lab puedes consultar tanto un arreglo pequeño como una renovación completa. Pásame la dirección de tu web y cuéntame qué te está frenando o qué te gustaría poder hacer.',
      'Después de revisar el proyecto, te propongo un alcance y un presupuesto: mantenimiento, una mejora concreta o el desarrollo de una web nueva cuando tenga sentido. La idea es que sepas qué vas a resolver antes de encargar el trabajo.'
    ],links:[['Conocer el servicio de diseño y desarrollo web','/servicios/desarrollo-web/']]}
  ],
  sources:[['Aviso oficial de PHP del 21 de octubre de 2026','https://www.php.net/archive/2026.php']]
}];
