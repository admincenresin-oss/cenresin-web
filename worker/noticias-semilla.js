// Noticias de ejemplo para que el blog no se vea vacío.
// Se cargan en la base de datos con migraciones/0002_noticias_ejemplo.sql
// (generado por scripts/preparar-publicacion.mjs) y también se publican como
// páginas estáticas de respaldo en /noticias/.
// Formato del texto: párrafos separados por una línea en blanco,
// "## " subtítulo, "### " pregunta o subtítulo chico, "- " lista,
// **negrita** y [texto](https://enlace).

export const NOTICIAS_SEMILLA = [
  {
    slug: 'virus-respiratorio-sincicial-vrs-adultos-mayores',
    titulo: 'Virus respiratorio sincicial (VRS) en adultos mayores: qué es y cómo prevenirlo',
    resumen: 'El VRS no solo afecta a los niños: en personas de 60 años o más y en quienes viven con enfermedades crónicas puede causar neumonía y hospitalización. Te explicamos síntomas, riesgos y cómo prevenirlo.',
    fecha: '2026-10-15',
    imagen_url: '/assets/img/noticias/vrs-adultos-mayores.jpg',
    imagen_alt: 'Coordinadora de CENRESIN conversando con una paciente adulta mayor',
    mostrar_inicio: 1,
    mostrar_estudios: 1,
    cuerpo: `El **virus respiratorio sincicial (VRS)** es uno de los virus respiratorios más comunes. Aunque suele asociarse a bronquiolitis en lactantes, en **adultos de 60 años o más** y en personas con enfermedades crónicas puede provocar cuadros graves, como neumonía o descompensación de enfermedades pulmonares y cardiacas.

## ¿Quiénes tienen más riesgo de complicaciones?

- Personas de 60 años o más.
- Personas con enfermedades pulmonares crónicas, como EPOC o asma.
- Personas con insuficiencia cardiaca u otras enfermedades del corazón.
- Personas con diabetes, enfermedad renal crónica o defensas disminuidas.
- Adultos mayores que viven en residencias o en contacto frecuente con niños pequeños.

## Síntomas más frecuentes

Al comienzo, el VRS se parece a un resfrío: congestión nasal, tos, dolor de garganta, fiebre baja y cansancio. En personas de riesgo puede avanzar a **dificultad para respirar, silbidos al pecho o empeoramiento de una enfermedad respiratoria de base**. Si aparecen estos signos, es importante consultar de inmediato.

## ¿Cómo prevenir el contagio?

- Lavarse las manos con frecuencia, especialmente antes de tocarse la cara.
- Ventilar los espacios cerrados.
- Evitar el contacto cercano con personas resfriadas, sobre todo si se tiene una enfermedad crónica.
- Quedarse en casa y usar mascarilla si se tienen síntomas respiratorios.
- Mantener al día las vacunas indicadas por el equipo de salud, como influenza y neumococo.

Hoy existen **vacunas contra el VRS desarrolladas para adultos de 60 años o más**. Conversa con tu médico si es recomendable en tu caso y dónde está disponible.

## Investigación clínica en VRS

En CENRESIN participamos en investigación clínica sobre **vacunas contra el virus respiratorio sincicial para adultos**. Si te interesa recibir información, puedes revisar nuestras [áreas de estudio](/estudios-disponibles.html). Contactarnos no implica ni garantiza la incorporación a un estudio.

## Preguntas frecuentes

### ¿El VRS es lo mismo que la influenza?

No. Son virus distintos, aunque producen síntomas parecidos y circulan en temporadas similares. Por eso la prevención de uno no reemplaza la del otro.

### ¿Un adulto puede tener VRS más de una vez?

Sí. La infección no deja una protección permanente, por lo que es posible contagiarse varias veces a lo largo de la vida.

### ¿Cuándo debo consultar?

Si tienes 60 años o más, o una enfermedad crónica, y presentas dificultad para respirar, fiebre que no cede o empeoramiento de tu enfermedad de base, consulta sin esperar.

## Fuentes

- [Centros para el Control y la Prevención de Enfermedades (CDC): VRS en adultos mayores](https://www.cdc.gov/rsv/)
- [Ministerio de Salud de Chile](https://www.minsal.cl/)`
  },
  {
    slug: 'rinitis-alergica-primavera-diferencia-resfrio',
    titulo: 'Rinitis alérgica en primavera: cómo distinguirla de un resfrío',
    resumen: 'Estornudos, picazón y nariz que gotea durante semanas suelen ser rinitis alérgica y no un resfrío. Te contamos cómo diferenciarlos, por qué conviene tratarla y qué exámenes ayudan a identificar la causa.',
    fecha: '2026-10-08',
    imagen_url: '/assets/img/noticias/rinitis-primavera.jpg',
    imagen_alt: 'Familia respirando al aire libre en un día de primavera',
    mostrar_inicio: 1,
    mostrar_estudios: 0,
    cuerpo: `Con la llegada de la primavera aumentan los pólenes en el aire y, con ellos, las consultas por **rinitis alérgica**. Es una inflamación de la mucosa de la nariz causada por una reacción del sistema inmune frente a sustancias como pólenes, ácaros del polvo o caspa de animales.

## ¿Resfrío o alergia?

- **Duración:** un resfrío suele durar entre 7 y 10 días. La rinitis alérgica se mantiene mientras dura la exposición, a veces durante semanas o meses.
- **Picazón:** la picazón de nariz, ojos o paladar es típica de la alergia y poco frecuente en el resfrío.
- **Fiebre y dolor de cuerpo:** pueden aparecer en un resfrío, pero no son propios de la rinitis alérgica.
- **Secreción:** en la alergia suele ser transparente y acuosa, acompañada de estornudos en serie.
- **Momento del año:** si los síntomas se repiten cada primavera, la alergia es la sospecha principal.

## ¿Por qué conviene tratarla?

La rinitis alérgica afecta el sueño, la concentración y la calidad de vida. Además, **la nariz y los bronquios forman una misma vía aérea**: muchas personas con rinitis alérgica también tienen asma, y una rinitis mal controlada puede dificultar el control del asma.

## ¿Cómo se estudia?

El médico evalúa los síntomas y puede indicar un **test cutáneo de alergias (prick test)**, que identifica a qué alérgenos reacciona la persona. Conocer la causa permite indicar medidas de control ambiental y un tratamiento más preciso. En CENRESIN realizamos este examen; puedes revisar sus indicaciones de preparación en [Exámenes](/examenes.html).

## Consejos para la temporada de pólenes

- Mantén las ventanas cerradas en las horas de más viento.
- Lava tus manos y tu cara al volver del exterior.
- Seca la ropa dentro de casa en los días de alta concentración de polen.
- No te automediques: consulta para recibir un tratamiento adecuado.

## Preguntas frecuentes

### ¿La rinitis alérgica se puede curar?

Se puede controlar muy bien. Con el tratamiento indicado y medidas de control ambiental, la mayoría de las personas reduce sus síntomas de forma importante.

### ¿El prick test duele?

Es un examen breve que se realiza con pequeñas punciones superficiales en la piel. Puede producir picazón leve en la zona durante algunos minutos.

### ¿La rinitis puede afectar el asma?

Sí. Ambas enfermedades están relacionadas y tratar la rinitis ayuda al control del asma.

## Fuentes

- [Organización Mundial de la Salud: asma](https://www.who.int/es/news-room/fact-sheets/detail/asthma)
- [Global Initiative for Asthma (GINA)](https://ginasthma.org/reports/)`
  },
  {
    slug: 'asma-senales-tratamiento-necesita-revision',
    titulo: 'Asma: 5 señales de que tu tratamiento necesita revisión',
    resumen: 'Despertar de noche con tos o usar el inhalador de rescate más de dos veces por semana son señales de que el asma no está bien controlada. Revisa estas cinco alertas y cuándo consultar.',
    fecha: '2026-09-29',
    imagen_url: '/assets/img/noticias/asma-control.jpg',
    imagen_alt: 'Box de atención médica de CENRESIN en Quillota',
    mostrar_inicio: 1,
    mostrar_estudios: 0,
    cuerpo: `El **asma** es una enfermedad crónica de los bronquios que, con un tratamiento adecuado, permite llevar una vida normal. El objetivo es que los síntomas estén controlados y que las crisis sean poco frecuentes. Estas son cinco señales de que tu asma podría **no estar bien controlada**.

## 1. Síntomas más de dos veces por semana

Tos, silbidos al pecho, opresión o falta de aire durante el día más de dos veces por semana indican que el tratamiento debe revisarse.

## 2. Despertar de noche por el asma

Despertar con tos o ahogo, aunque sea una vez, es una señal de alerta.

## 3. Usar el inhalador de rescate con frecuencia

Necesitar el inhalador de alivio rápido más de dos veces por semana (sin contar su uso antes del ejercicio, si fue indicado) muestra que la inflamación de los bronquios no está controlada.

## 4. Limitación en tus actividades

Dejar de hacer ejercicio, subir escaleras con dificultad o faltar al trabajo o al colegio por el asma no es "normal" y tiene solución.

## 5. Crisis o visitas a urgencia

Una crisis que requirió urgencia o corticoides orales en el último año es motivo para una evaluación con especialista.

## ¿Qué hacer si te identificas con estas señales?

- Consulta con tu médico broncopulmonar para revisar el tratamiento.
- Lleva tus inhaladores a la consulta: revisar la **técnica inhalatoria** es clave.
- No suspendas el tratamiento de mantención aunque te sientas bien.
- Pregunta por exámenes como la **espirometría** o el **FeNO**, que ayudan a evaluar la función pulmonar y la inflamación bronquial.

## Preguntas frecuentes

### ¿El asma se puede controlar por completo?

En la mayoría de los casos sí. Con el tratamiento adecuado y controles periódicos, muchas personas pasan largos periodos sin síntomas.

### ¿El asma severa tiene alternativas de tratamiento?

Sí. Existen tratamientos para asma severa que deben ser indicados por un especialista. También se investigan nuevas alternativas en estudios clínicos.

### ¿Cada cuánto debo controlarme?

Depende de cada persona, pero se recomienda un control periódico aunque estés bien, y siempre después de una crisis.

## Fuentes

- [Global Initiative for Asthma (GINA)](https://ginasthma.org/reports/)
- [Organización Mundial de la Salud: asma](https://www.who.int/es/news-room/fact-sheets/detail/asthma)`
  },
  {
    slug: 'epoc-espirometria-diagnostico-temprano',
    titulo: 'EPOC: por qué la espirometría es clave para el diagnóstico temprano',
    resumen: 'La EPOC suele confundirse con el "cansancio de la edad" o la "tos del fumador". La espirometría es el examen que confirma el diagnóstico y permite iniciar el tratamiento a tiempo.',
    fecha: '2026-09-17',
    imagen_url: '/assets/img/noticias/epoc-espirometria.jpg',
    imagen_alt: 'Sala de atención de CENRESIN preparada para exámenes respiratorios',
    mostrar_inicio: 0,
    mostrar_estudios: 1,
    cuerpo: `La **enfermedad pulmonar obstructiva crónica (EPOC)** es una enfermedad respiratoria frecuente que dificulta la salida del aire de los pulmones. Muchas personas conviven años con sus síntomas sin saber que la tienen, porque los atribuyen a la edad, al cigarrillo o a la falta de ejercicio.

## Síntomas que no conviene normalizar

- Falta de aire al caminar, subir escaleras o hacer tareas cotidianas.
- Tos que dura meses, especialmente en las mañanas.
- Flema frecuente.
- Silbidos al pecho o resfríos que "bajan al pecho" con facilidad.

## Factores de riesgo

El principal es el **tabaquismo**, actual o pasado. También influyen la exposición prolongada al **humo de leña o de estufas**, el polvo y los gases en el trabajo, la contaminación del aire y las infecciones respiratorias frecuentes en la infancia.

## ¿Qué es la espirometría?

Es un examen simple y no invasivo que mide **cuánto aire puede expulsar una persona y a qué velocidad**. Se sopla con fuerza a través de una boquilla conectada a un equipo, antes y después de recibir un broncodilatador. Es el examen que **confirma el diagnóstico de EPOC** y ayuda a definir su gravedad.

En CENRESIN realizamos espirometría basal y espirometría con broncodilatador. Revisa la preparación de cada examen en [Exámenes](/examenes.html).

## ¿Por qué diagnosticar a tiempo?

- Dejar de fumar en etapas tempranas frena el deterioro de la función pulmonar.
- El tratamiento inhalado mejora los síntomas y reduce las crisis.
- La rehabilitación respiratoria y la actividad física mejoran la calidad de vida.
- Las vacunas indicadas por el equipo de salud ayudan a prevenir infecciones que descompensan la EPOC.

## Investigación en EPOC

La EPOC es una de las áreas en las que CENRESIN desarrolla investigación clínica. Si te interesa recibir información, revisa nuestras [áreas de estudio](/estudios-disponibles.html).

## Preguntas frecuentes

### ¿La espirometría duele?

No. Solo requiere soplar con fuerza varias veces. Puede producir un poco de cansancio o tos pasajera.

### ¿Quién debería hacerse una espirometría?

Personas mayores de 40 años con síntomas respiratorios persistentes y antecedentes de tabaquismo o exposición a humo, o quien lo indique su médico.

### ¿La EPOC tiene tratamiento?

Sí. Aunque es una enfermedad crónica, el tratamiento adecuado mejora los síntomas, reduce las crisis y permite mantener una vida activa.

## Fuentes

- [Global Initiative for Chronic Obstructive Lung Disease (GOLD)](https://goldcopd.org/)
- [Organización Mundial de la Salud: EPOC](https://www.who.int/es/news-room/fact-sheets/detail/chronic-obstructive-pulmonary-disease-(copd))`
  },
  {
    slug: 'estudios-clinicos-mitos-y-verdades',
    titulo: 'Estudios clínicos: 6 mitos y verdades sobre participar',
    resumen: '¿Participar en un estudio clínico es ser "conejillo de Indias"? ¿Me puedo retirar cuando quiera? Respondemos las dudas más comunes sobre la investigación clínica y cómo se protege a los participantes.',
    fecha: '2026-09-03',
    imagen_url: '/assets/img/noticias/estudios-clinicos-mitos.jpg',
    imagen_alt: 'Participante conversando con una coordinadora de estudios clínicos de CENRESIN',
    mostrar_inicio: 0,
    mostrar_estudios: 1,
    cuerpo: `Los **estudios clínicos** son investigaciones que evalúan la seguridad y eficacia de nuevos tratamientos, vacunas o estrategias de salud en personas. Gracias a ellos existen la mayoría de los medicamentos que usamos hoy. Aun así, generan muchas dudas. Revisamos seis mitos frecuentes.

## Mito 1: "Los participantes son conejillos de Indias"

**Falso.** Cada estudio sigue un protocolo revisado y aprobado por un **Comité Ético Científico** y por las autoridades correspondientes antes de comenzar. En Chile, la investigación en seres humanos está regulada, entre otras normas, por la Ley 20.120.

## Mito 2: "Si entro, no me puedo salir"

**Falso.** La participación es **voluntaria**. Puedes retirarte en cualquier momento y por cualquier motivo, sin que eso afecte tu atención de salud.

## Mito 3: "No me van a explicar lo que me harán"

**Falso.** Antes de participar recibes el **consentimiento informado**: un documento que explica el objetivo del estudio, los procedimientos, las visitas, los posibles riesgos y beneficios. Tienes tiempo para leerlo, hacer preguntas y conversarlo con tu familia.

## Mito 4: "Cualquier persona puede participar"

**No necesariamente.** Cada estudio tiene criterios de inclusión y exclusión, como edad, diagnóstico o tratamientos previos. Por eso el equipo realiza evaluaciones antes de confirmar si una persona puede participar.

## Mito 5: "Mis datos quedarán expuestos"

**Falso.** La información de los participantes se trata de forma **confidencial** y se protege según la normativa vigente.

## Mito 6: "Participar no aporta nada"

**Falso.** Cada participante contribuye al desarrollo de nuevas alternativas terapéuticas. Según el estudio, también puede acceder a evaluaciones y seguimiento médico establecidos en el protocolo.

## ¿Cómo saber si hay un estudio para mí?

En CENRESIN desarrollamos investigación en asma, EPOC, fibrosis pulmonar, bronquiectasias, rinosinusitis crónica con pólipos nasales y otras áreas. Revisa las [áreas de estudio](/estudios-disponibles.html) o [solicita información](/formulario-estudios-clinicos.html). Contactarnos no implica ni garantiza la incorporación a un estudio.

## Preguntas frecuentes

### ¿Participar tiene algún costo?

Las condiciones de cada estudio se informan antes de participar, en el consentimiento informado.

### ¿Quién supervisa los estudios clínicos?

Un Comité Ético Científico, el investigador responsable, el patrocinador y las autoridades sanitarias correspondientes.

### ¿Puedo seguir con mi médico tratante?

Sí. El equipo de investigación puede coordinarse con tu médico tratante cuando corresponda.

## Fuentes

- [Ley 20.120 sobre la investigación científica en el ser humano (Biblioteca del Congreso Nacional)](https://www.bcn.cl/leychile/navegar?idNorma=253478)
- [Instituto de Salud Pública de Chile](https://www.ispch.cl/)`
  }
];
