'use client'

import { useState } from 'react'
import { LibraryHome } from './LibraryHome'
import { CollectionView } from './CollectionView'
import { BookmarksView } from './BookmarksView'
import { useAuthStore } from '@/stores/auth'

type LibView = 'home' | 'collection' | 'bookmarks' | 'search'

interface Props {
  searchQuery: string
}

export function LibraryView({ searchQuery }: Props) {
  const { token } = useAuthStore()
  const [view, setView] = useState<LibView>('home')
  const [activeCollId, setActiveCollId] = useState<string | null>(null)

  const openCollection = (id: string) => {
    setActiveCollId(id)
    setView('collection')
  }

  const openBookmarks = () => {
    if (!token) return
    setView('bookmarks')
  }

  const goHome = () => {
    setView('home')
    setActiveCollId(null)
  }

  if (view === 'collection' && activeCollId) {
    return <CollectionView collectionId={activeCollId} onBack={goHome} />
  }
  if (view === 'bookmarks') {
    return <BookmarksView onBack={goHome} />
  }

  return (
    <LibraryHome
      onOpenCollection={openCollection}
      onOpenBookmarks={openBookmarks}
    />
  )
}
