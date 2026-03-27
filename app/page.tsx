export const runtime = 'nodejs'

import { getGraphConfig, getCurriculum } from '@/lib/content'
import MapPage from '@/components/MapPage'

export default async function Home() {
  const graph = getGraphConfig()
  const orderedIds = getCurriculum()

  return <MapPage graph={graph} orderedIds={orderedIds} />
}
