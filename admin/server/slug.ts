/*
  Ukrainian → Latin transliteration, following the official table used for
  passports and place names (Cabinet of Ministers resolution No. 55, 2010).

  Slugs are the site's URLs, so they are Latin rather than percent-encoded
  Cyrillic: a link that survives being pasted into a messenger is worth more
  than a literal transcription.
*/

const TABLE: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie',
  ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
  ю: 'iu', я: 'ia', "'": '', '’': '', ʼ: '',
}

/** Word-initial forms differ from the rest: Єва → Yeva, but Мрія → Mriia. */
const INITIAL: Record<string, string> = {
  є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya',
}

/** зг → zgh, to keep it distinct from ж (zh). */
function transliterateWord(word: string): string {
  let out = ''

  for (let i = 0; i < word.length; i++) {
    const char = word[i]
    const lower = char.toLowerCase()

    if (lower === 'з' && word[i + 1]?.toLowerCase() === 'г') {
      out += 'zgh'
      i++
      continue
    }

    const mapped =
      i === 0 && lower in INITIAL ? INITIAL[lower] : (TABLE[lower] ?? lower)
    out += mapped
  }

  return out
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map(transliterateWord)
    .join('-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/-$/, '')
}

/** A slug for an attachment's file name, e.g. "Презентація" → "prezentatsiia". */
export function slugifyLabel(label: string): string {
  return slugify(label) || 'fail'
}
