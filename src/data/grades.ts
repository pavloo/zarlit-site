import type { Grade } from './types'

export interface GradeInfo {
  grade: Grade
  /** Short blurb naming the programme's centre of gravity for the year. */
  blurb: string
}

// TODO: the site owner may want to reword these to match the programme they teach.
export const gradeList: GradeInfo[] = [
  { grade: 5, blurb: 'Казки народів світу, літературні казки, світ дитинства' },
  { grade: 6, blurb: 'Міфи народів світу, пригодницька література' },
  { grade: 7, blurb: 'Билини й балади, історичне минуле в літературі' },
  { grade: 8, blurb: 'Священні книги людства, доба Відродження' },
  { grade: 9, blurb: 'Просвітництво, романтизм, становлення реалізму' },
  { grade: 10, blurb: 'Реалізм, ранній модернізм, драматургія' },
  { grade: 11, blurb: 'Література ХХ — початку ХХІ століття' },
]

export const gradeInfo = new Map(gradeList.map((item) => [item.grade, item]))
