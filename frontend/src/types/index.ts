// ── Auth ─────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  displayName: string
  username: string | null
  profilePhoto: string | null
  bio: string | null
  location: string | null
  tradition: Tradition | null
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  preferredLanguage: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
}

// ── Enums ─────────────────────────────────────────────────────
export type Tradition =
  | 'THERAVADA'
  | 'MAHAYANA'
  | 'VAJRAYANA'
  | 'NAVAYANA'
  | 'ZEN'
  | 'PURE_LAND'
  | 'TIBETAN'
  | 'MULTIPLE'
  | 'OTHER'

export type PostCategory =
  | 'DHARMA'
  | 'PRACTICE'
  | 'COMMUNITY'
  | 'QUESTION'
  | 'RESOURCE'
  | 'EVENT'
  | 'OTHER'

export type Language = 'en' | 'hi' | 'mr' | 'sa' | 'te' | 'ta' | 'pa' | 'gu'

// ── Posts / Feed ──────────────────────────────────────────────
export interface Post {
  id: string
  content: string
  category: PostCategory
  tradition: Tradition | null
  language: string
  mediaUrls: string[]
  likesCount: number
  commentsCount: number
  sharesCount: number
  isLiked: boolean
  isBookmarked: boolean
  author: UserSummary
  community: CommunitySummary | null
  createdAt: string
  updatedAt: string
}

export interface UserSummary {
  id: string
  displayName: string
  username: string | null
  profilePhoto: string | null
  tradition: Tradition | null
  role: string
  city?: string | null
  isVerifiedClergy?: boolean
}

// Raw API feed post shape (Prisma _count fields + traditionTags array)
export interface FeedPost {
  id: string
  content: string
  category?: PostCategory
  traditionTags?: string[]
  mediaUrls: string[]
  isBookmarked?: boolean
  _count?: { likes: number; comments: number }
  likesCount?: number
  commentsCount?: number
  isLiked?: boolean
  author: UserSummary
  community: CommunitySummary | null
  createdAt: string
}

export interface CommunitySummary {
  id: string
  name: string
  tradition: Tradition | null
  avatar: string | null
}

export interface Comment {
  id: string
  content: string
  author: UserSummary
  likesCount: number
  isLiked: boolean
  createdAt: string
  replies?: Comment[]
}

// ── Library ───────────────────────────────────────────────────
export interface LibraryCollection {
  id: string
  name: string
  description: string | null
  tradition: Tradition
  languages: Language[]
  licence: string | null
  _count: { texts: number }
}

export interface LibraryText {
  id: string
  title: string
  author: string | null
  translator: string | null
  language: Language
  coverUrl: string | null
  sourceUrl: string | null
  segmentsTotal: number
  createdAt: string
  collection: {
    id: string
    name: string
    tradition: Tradition
    sourceUrl?: string | null
  } | null
}

export interface LibraryTextDetail extends LibraryText {
  segments: TextSegment[]
  attribution: string | null
}

export interface ServerProgress {
  percentComplete: number
  currentSegment: number
}

export interface TextSegment {
  id: string
  index: number
  content: string
  paliContent: string | null
  reference: string | null
  segmentKey?: string | null
  chapterRef?: string | null
}

export interface ReadingProgress {
  textId: string
  percent: number
  lastRead: number
  title: string
  tradition: Tradition | null
}

export interface Highlight {
  id: string
  textId: string
  segmentId: string
  selectedText: string
  color: string
  note: string | null
  startIndex: number
  endIndex: number
  createdAt: string
}

// ── Communities / Associations ────────────────────────────────
export interface AssociationSummary {
  id: string
  name: string
  description: string | null
  tradition: Tradition | null
  category: string | null
  city: string | null
  country: string | null
  website: string | null
  isVerified: boolean
  _count: { members: number }
  memberRole?: string // present on /associations/mine results only
}

export interface AssociationMember {
  memberRole: string
  user: { id: string; displayName: string; profilePhoto: string | null }
}

export interface AssociationEvent {
  id: string
  title: string
  startsAt: string
}

export interface AssociationDetail extends AssociationSummary {
  members: AssociationMember[]
  events: AssociationEvent[]
}

export interface AssociationMembership {
  isMember: boolean
  memberRole: string | null
}

export interface CommunityCourse {
  id: string
  title: string
  description: string | null
  tradition: Tradition | null
  language: string | null
  _count?: { lessons: number }
  instructor?: { displayName: string }
}

export interface CommunityResource {
  id: string
  title: string
  type: string
  url: string
  thumbnailUrl: string | null
  creator: string | null
  durationSecs: number | null
  language: string | null
}

export interface CommunityProject {
  id: string
  title: string
  icon: string | null
  purpose: string | null
  status: string
  _count?: { members: number }
}

export interface CommunityCircle {
  id: string
  topic: string
  description: string | null
  status: string
  scheduleDescription: string | null
  _count?: { members: number }
  facilitator?: { displayName: string }
}

// Legacy alias kept for feed components that reference Community
export interface Community {
  id: string
  name: string
  description: string | null
  tradition: Tradition | null
  avatar: string | null
  isPrivate: boolean
  memberCount: number
  isMember: boolean
  isAdmin: boolean
  _count: { members: number; posts: number }
}

// ── Study Circles ─────────────────────────────────────────────
export interface StudyCircle {
  id: string
  name: string
  description: string | null
  tradition: Tradition | null
  avatar: string | null
  memberCount: number
  isMember: boolean
  _count?: { members: number }
}

// ── Events ────────────────────────────────────────────────────
export interface SanghamEvent {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  isOnline: boolean
  streamUrl: string | null
  tradition: Tradition | null
  organizer: UserSummary
  attendeeCount: number
  isAttending: boolean
  coverImage: string | null
}

// ── Messages ──────────────────────────────────────────────────
export type MessageType = 'text' | 'link' | 'photo'

export interface Conversation {
  id: string
  type: 'direct' | 'group'
  name: string | null
  photoUrl: string | null
  participants: UserSummary[]
  lastMessage: Message | null
  unreadCount: number
  updatedAt: string
}

export interface Message {
  id: string
  content: string
  type: MessageType
  mediaUrl: string | null
  linkPreview: { url: string; title?: string; description?: string; image?: string } | null
  senderId: string
  senderName: string
  senderPhoto: string | null
  conversationId: string
  createdAt: string
  isRead: boolean
  encrypted: boolean
}

// ── Notifications ─────────────────────────────────────────────
export interface Notification {
  id: string
  type: string
  message: string
  isRead: boolean
  actorId: string | null
  actor: UserSummary | null
  resourceId: string | null
  createdAt: string
}

// ── Teachers / Associations ───────────────────────────────────
export interface Teacher {
  id: string
  name: string
  tradition: Tradition | null
  bio: string | null
  photo: string | null
  website: string | null
}

export interface Association {
  id: string
  name: string
  tradition: Tradition | null
  description: string | null
  website: string | null
  logo: string | null
}

// ── API responses ─────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiError {
  error: string
  message?: string
  statusCode?: number
}

// ── Discover ──────────────────────────────────────────────────
export interface DiscoverPerson {
  id: string
  displayName: string
  username: string | null
  profilePhoto: string | null
  bio: string | null
  city: string | null
  country: string | null
  tradition: Tradition | null
  traditions: Tradition[]
  role: string
  isVerifiedTeacher: boolean
  isVerifiedClergy: boolean
  seekingIntent: string | null
  languages: string[]
  followersCount?: number
  isFollowing?: boolean
}

export interface DiscoverCategory {
  id: string
  name: string
  slug: string
  icon?: string | null
}

export interface EventItem {
  id: string
  title: string
  description: string | null
  type: string
  mode: string
  startsAt: string
  endsAt: string | null
  location: string | null
  onlineUrl: string | null
  tradition: Tradition | null
  language: string | null
  organizer: { id: string; displayName: string; profilePhoto: string | null }
  association: { id: string; name: string } | null
  _count: { rsvps?: number; attendees?: number }
  myRsvp: string | null
  coverUrl: string | null
}

export interface DiscoverProject {
  id: string
  title: string
  icon: string | null
  purpose: string | null
  description: string | null
  status: string
  category: string | null
  tradition: Tradition | null
  skillsNeeded: string[]
  requiredLanguages: string[]
  association: { id: string; name: string } | null
  lead: { id: string; displayName: string; profilePhoto: string | null } | null
  _count: { members: number }
}

export interface UserProfile {
  id: string
  displayName: string
  username: string | null
  profilePhoto: string | null
  coverImage: string | null
  bio: string | null
  city: string | null
  country: string | null
  templeAffiliation: string | null
  tradition: Tradition | null
  traditions: Tradition[]
  role: string
  isVerifiedTeacher: boolean
  isVerifiedClergy: boolean
  seekingIntent: string | null
  languages: string[]
  interests: string[]
  followersCount: number
  followingCount: number
  postsCount: number
  isFollowing: boolean
  createdAt: string
}

// ── Participation Visibility ──────────────────────────────────
export interface UserParticipations {
  circles: { id: string; topic: string; status: string }[]
  events: { id: string; title: string; startsAt: string; type: string }[]
  courses: { id: string; title: string }[]
  sessions: { id: string; topic: string; startsAt: string }[]
}

// ── UI state ──────────────────────────────────────────────────
export type Tab = 'home' | 'learn' | 'communities' | 'discover' | 'messages'
export type LearnSubTab = 'courses' | 'resources' | 'circles' | 'sessions' | 'library'
export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}
