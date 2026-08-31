import { site } from './site'
import type { Grade, Lesson } from './types'

/*
  Milestone 1: hardcoded sample lessons so the pages can be built and reviewed.
  Milestone 2 replaces the `allLessons` constant with the generated
  `src/generated/lessons.json`; every accessor below keeps its signature, so
  the pages will not change. The file URLs are placeholders and do not resolve
  yet — real ones arrive with the R2 uploads.
*/

const file = (path: string) => `${site.filesUrl}/${path}`

const allLessons: Lesson[] = [
  {
    slug: 'narodni-kazky-vstup',
    title: 'Народна казка. Вступ до розділу',
    description:
      'Ознайомлення з жанром народної казки, її будовою та поширеними мотивами. ' +
      'Презентація та роздатковий матеріал для роботи в групах.',
    grade: 5,
    order: 1,
    topic: 'Казки народів світу',
    attachments: [
      {
        label: 'Презентація',
        url: file('5/narodni-kazky-vstup-prezentatsiia.pptx'),
        filename: 'narodni-kazky-vstup-prezentatsiia.pptx',
        size: 3_984_128,
        type: 'pptx',
      },
      {
        label: 'Роздатковий матеріал',
        url: file('5/narodni-kazky-vstup-rozdatkovyi.docx'),
        filename: 'narodni-kazky-vstup-rozdatkovyi.docx',
        size: 48_233,
        type: 'docx',
      },
    ],
    publishedAt: '2026-08-28',
  },
  {
    slug: 'pan-tvardovskyi',
    title: 'Адам Міцкевич. Балада «Пані Твардовська»',
    description:
      'Аналіз балади, робота з фольклорними джерелами сюжету. Конспект уроку ' +
      'та завдання для перевірки розуміння тексту.',
    grade: 5,
    order: 2,
    topic: 'Літературна балада',
    work: 'Пані Твардовська',
    attachments: [
      {
        label: 'Конспект уроку',
        url: file('5/pan-tvardovskyi-konspekt.docx'),
        filename: 'pan-tvardovskyi-konspekt.docx',
        size: 62_914,
        type: 'docx',
      },
    ],
    publishedAt: '2026-08-29',
  },
  {
    slug: 'mify-davnoi-hretsii',
    title: 'Міфи Давньої Греції. Загальна характеристика',
    description:
      'Оглядовий урок: походження міфів, пантеон богів, основні цикли. ' +
      'Презентація з ілюстраціями та схема для конспектування.',
    grade: 6,
    order: 1,
    topic: 'Міфи народів світу',
    attachments: [
      {
        label: 'Презентація',
        url: file('6/mify-davnoi-hretsii-prezentatsiia.pptx'),
        filename: 'mify-davnoi-hretsii-prezentatsiia.pptx',
        size: 7_340_032,
        type: 'pptx',
      },
    ],
    publishedAt: '2026-08-20',
  },
  {
    slug: 'homer-odisseia-obraz-odisseia',
    title: 'Гомер. «Одіссея». Образ Одіссея',
    description:
      'Характеристика головного героя, поняття про епічного героя та мандрівний ' +
      'сюжет. Презентація, роздатковий матеріал і тест із десяти запитань.',
    grade: 6,
    order: 2,
    topic: 'Антична література',
    work: 'Одіссея',
    attachments: [
      {
        label: 'Презентація',
        url: file('6/homer-odisseia-prezentatsiia.pptx'),
        filename: 'homer-odisseia-prezentatsiia.pptx',
        size: 4_718_592,
        type: 'pptx',
      },
      {
        label: 'Тест',
        url: file('6/homer-odisseia-test.pdf'),
        filename: 'homer-odisseia-test.pdf',
        size: 184_320,
        type: 'pdf',
      },
    ],
    publishedAt: '2026-08-22',
    updatedAt: '2026-08-27',
  },
  {
    slug: 'robin-hud-balady',
    title: 'Балади про Робіна Гуда',
    description:
      'Народна балада як жанр, історичне тло, образ благородного розбійника. ' +
      'Матеріали для читання в ролях.',
    grade: 7,
    order: 1,
    topic: 'Билини й балади',
    attachments: [
      {
        label: 'Конспект уроку',
        url: file('7/robin-hud-konspekt.docx'),
        filename: 'robin-hud-konspekt.docx',
        size: 71_680,
        type: 'docx',
      },
    ],
    publishedAt: '2026-08-18',
  },
  {
    slug: 'shekspir-hamlet-vstup',
    title: 'Вільям Шекспір. «Гамлет». Вступ',
    description:
      'Доба Відродження, театр Шекспіра, історія сюжету. Презентація з ' +
      'фрагментами постановок і план аналізу трагедії.',
    grade: 9,
    order: 1,
    topic: 'Відродження',
    work: 'Гамлет',
    attachments: [
      {
        label: 'Презентація',
        url: file('9/shekspir-hamlet-prezentatsiia.pptx'),
        filename: 'shekspir-hamlet-prezentatsiia.pptx',
        size: 9_437_184,
        type: 'pptx',
      },
      {
        label: 'План аналізу',
        url: file('9/shekspir-hamlet-plan.pdf'),
        filename: 'shekspir-hamlet-plan.pdf',
        size: 129_024,
        type: 'pdf',
      },
    ],
    publishedAt: '2026-08-15',
  },
  {
    slug: 'kafka-peretvorennia',
    title: 'Франц Кафка. «Перетворення»',
    description:
      'Модерністська проза, поняття абсурду, символіка новели. Конспект уроку ' +
      'та добірка питань для дискусії.',
    grade: 11,
    order: 1,
    topic: 'Модернізм',
    work: 'Перетворення',
    attachments: [
      {
        label: 'Конспект уроку',
        url: file('11/kafka-peretvorennia-konspekt.docx'),
        filename: 'kafka-peretvorennia-konspekt.docx',
        size: 83_968,
        type: 'docx',
      },
    ],
    publishedAt: '2026-08-12',
  },
]

const byOrder = (a: Lesson, b: Lesson) =>
  a.order - b.order || a.title.localeCompare(b.title, 'uk')

export function getLessonsByGrade(grade: Grade): Lesson[] {
  return allLessons.filter((lesson) => lesson.grade === grade).sort(byOrder)
}

export function getLesson(grade: Grade, slug: string): Lesson | undefined {
  return allLessons.find(
    (lesson) => lesson.grade === grade && lesson.slug === slug,
  )
}

export function getLessonCount(grade: Grade): number {
  return allLessons.filter((lesson) => lesson.grade === grade).length
}

export function getRecentLessons(limit = 4): Lesson[] {
  return [...allLessons]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
}
