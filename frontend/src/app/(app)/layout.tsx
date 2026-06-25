import { AppShell } from '@/components/layout/AppShell'
import { FeedTab } from '@/components/feed/FeedTab'
import { LearnTab } from '@/components/learn/LearnTab'
import { CommunitiesTab } from '@/components/communities/CommunitiesTab'
import { DiscoverTab } from '@/components/discover/DiscoverTab'
import { MessagesTab } from '@/components/messages/MessagesTab'

export default function AppLayout() {
  return (
    <AppShell
      home={<FeedTab />}
      learn={<LearnTab />}
      communities={<CommunitiesTab />}
      discover={<DiscoverTab />}
      messages={<MessagesTab />}
    />
  )
}

