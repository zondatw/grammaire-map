import { Suspense } from 'react'
import { getLanguageData } from '@/lib/content'
import type { Language, LanguageData } from '@/lib/types'
import DrillPage from '@/components/DrillPage'

export default async function DrillRoute() {
  const langs: Language[] = ['fr', 'es']
  const allLanguages: Record<string, LanguageData> = Object.fromEntries(
    langs.map((lang) => [lang, getLanguageData(lang)])
  )

  // Suspense boundary required when a client component calls useSearchParams()
  return (
    <Suspense>
      <DrillPage allLanguages={allLanguages} />
    </Suspense>
  )
}
