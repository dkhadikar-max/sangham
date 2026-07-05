'use client'

import { useEvent } from '@/hooks/useEvents'
import { EventDetailPanel } from './EventDetailPanel'

interface Props {
  eventId: string
  onClose: () => void
  onOpenProfile: (id: string) => void
}

export function EventDetailById({ eventId, onClose, onOpenProfile }: Props) {
  const { data: event, isLoading } = useEvent(eventId)
  if (isLoading || !event) {
    return (
      <div className="panel-comm" style={{ zIndex: 55 }}>
        <div className="panel-header">
          <button className="panel-back" onClick={onClose} aria-label="Close"><i className="fa-solid fa-arrow-left" /></button>
          <span className="panel-title">Event Details</span>
        </div>
        <div className="spinner-center" style={{ paddingTop: 'var(--space-16)' }}><div className="spinner spinner-lg" /></div>
      </div>
    )
  }
  return <EventDetailPanel event={event} onClose={onClose} onOpenProfile={onOpenProfile} />
}
