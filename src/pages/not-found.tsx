import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { gradeList } from '@/data/grades'
import { paths } from '@/lib/paths'

export function NotFoundPage() {
  return (
    <div className="space-y-6 py-8 text-center">
      <p className="text-muted-foreground text-6xl font-bold">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Сторінку не знайдено</h1>
      <p className="text-muted-foreground">
        Можливо, посилання застаріло. Оберіть клас нижче.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {gradeList.map(({ grade }) => (
          <Link
            key={grade}
            to={paths.grade(grade)}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            {grade} клас
          </Link>
        ))}
      </div>
      <Link to={paths.home} className={buttonVariants({ variant: 'link' })}>
        На головну
      </Link>
    </div>
  )
}
