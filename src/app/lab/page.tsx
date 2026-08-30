import { permanentRedirect } from 'next/navigation'

export default function LegacyLabHubPage() {
  permanentRedirect('/labs')
}
