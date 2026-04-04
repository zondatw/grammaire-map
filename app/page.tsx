import { getLanguageData } from '@/lib/content'
import type { Language, LanguageData } from '@/lib/types'
import MapPage from '@/components/MapPage'

export default async function Home() {
  const langs: Language[] = ['fr', 'es']
  const allLanguages: Record<string, LanguageData> = Object.fromEntries(
    langs.map((lang) => [lang, getLanguageData(lang)])
  )

  return <MapPage allLanguages={allLanguages} />
}
