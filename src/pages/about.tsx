import { site } from '@/data/site'

export function AboutPage() {
  return (
    <article className="max-w-[70ch] space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Про сайт</h1>
      {/* TODO: replace with the owner's own text before launch. */}
      <p className="leading-relaxed">
        Цей сайт — добірка матеріалів до уроків зарубіжної літератури для 5–11
        класів: розробки уроків, презентації, роздаткові матеріали та завдання.
        Усі матеріали доступні безкоштовно, без реєстрації.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        Сайт створює і наповнює вчитель зарубіжної літератури.
      </p>
      {site.email && (
        <p className="leading-relaxed">
          Маєте запитання чи пропозицію?{' '}
          <a
            href={`mailto:${site.email}`}
            className="text-primary underline underline-offset-4"
          >
            {site.email}
          </a>
        </p>
      )}
    </article>
  )
}
