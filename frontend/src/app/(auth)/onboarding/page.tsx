'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

// ── Static data ──────────────────────────────────────────────────────────────

const PROFESSION_OPTIONS = [
  { value: 'STUDENT',        label: 'Student' },
  { value: 'TEACHER',        label: 'Teacher / Educator' },
  { value: 'RESEARCHER',     label: 'Researcher / Academic' },
  { value: 'DOCTOR',         label: 'Doctor / Healthcare' },
  { value: 'ENGINEER',       label: 'Engineer / Developer' },
  { value: 'LAWYER',         label: 'Lawyer / Legal' },
  { value: 'BUSINESS_OWNER', label: 'Business Owner' },
  { value: 'ENTREPRENEUR',   label: 'Entrepreneur' },
  { value: 'ARTIST',         label: 'Artist / Creative' },
  { value: 'WRITER',         label: 'Writer / Journalist' },
  { value: 'ACTIVIST',       label: 'Activist / Organiser' },
  { value: 'CIVIL_SERVANT',  label: 'Civil Servant / Government' },
  { value: 'EMPLOYEE',       label: 'Employee' },
  { value: 'MONK_NUN',       label: 'Monk / Nun / Renunciate' },
  { value: 'VOLUNTEER',      label: 'Volunteer' },
  { value: 'OTHER',          label: 'Other' },
]

const INTEREST_OPTIONS = [
  { value: 'education',         label: 'Education' },
  { value: 'study',             label: 'Study & Learning' },
  { value: 'meditation',        label: 'Meditation & Practice' },
  { value: 'service',           label: 'Community Service' },
  { value: 'tech',              label: 'Technology' },
  { value: 'ai',                label: 'AI & Innovation' },
  { value: 'entrepreneurship',  label: 'Entrepreneurship' },
  { value: 'social_change',     label: 'Social Change' },
  { value: 'leadership',        label: 'Leadership' },
  { value: 'language_learning', label: 'Language Learning' },
  { value: 'translation',       label: 'Translation' },
  { value: 'writing',           label: 'Writing' },
  { value: 'art',               label: 'Art & Culture' },
  { value: 'research',          label: 'Research' },
  { value: 'volunteering',      label: 'Volunteering' },
]

const PURPOSE_CATEGORIES = [
  {
    label: 'Connections',
    items: [
      { value: 'pur_meet_people',      label: 'Meet like-minded people' },
      { value: 'pur_local_community',  label: 'Local community' },
      { value: 'pur_discussion',       label: 'Discussions & debate' },
      { value: 'pur_networking',       label: 'Professional networking' },
    ],
  },
  {
    label: 'Learning',
    items: [
      { value: 'pur_education',        label: 'Education' },
      { value: 'pur_courses',          label: 'Courses & workshops' },
      { value: 'pur_study_groups',     label: 'Study groups' },
      { value: 'pur_research',         label: 'Research' },
      { value: 'pur_language_learning',label: 'Language learning' },
    ],
  },
  {
    label: 'Career',
    items: [
      { value: 'pur_skill_dev',        label: 'Skill development' },
      { value: 'pur_career_guidance',  label: 'Career guidance' },
      { value: 'pur_mentorship',       label: 'Mentorship' },
      { value: 'pur_leadership',       label: 'Leadership' },
    ],
  },
  {
    label: 'Entrepreneurship',
    items: [
      { value: 'pur_entrepreneurship', label: 'Entrepreneurship' },
      { value: 'pur_startups',         label: 'Startups' },
      { value: 'pur_tech',             label: 'Tech projects' },
      { value: 'pur_ai',               label: 'AI & innovation' },
      { value: 'pur_projects',         label: 'Collaborative projects' },
    ],
  },
  {
    label: 'Service',
    items: [
      { value: 'pur_volunteering',     label: 'Volunteering' },
      { value: 'pur_social_service',   label: 'Social service' },
      { value: 'pur_ngo',              label: 'NGO / non-profit' },
      { value: 'pur_community_dev',    label: 'Community development' },
    ],
  },
  {
    label: 'Mindfulness',
    items: [
      { value: 'pur_meditation',       label: 'Meditation' },
      { value: 'pur_mindfulness',      label: 'Mindfulness' },
      { value: 'pur_buddhist_study',   label: 'Buddhist study' },
      { value: 'pur_teacher_guidance', label: 'Teacher guidance' },
    ],
  },
]

const SPOKEN_LANGUAGES = [
  { value: 'hi', label: 'हिन्दी' },
  { value: 'en', label: 'English' },
  { value: 'mr', label: 'मराठी' },
  { value: 'gu', label: 'ગુજરાતી' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ' },
  { value: 'bn', label: 'বাংলা' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
  { value: 'ml', label: 'മലയാളം' },
  { value: 'or', label: 'ଓଡ଼ିଆ' },
  { value: 'as', label: 'অসমীয়া' },
  { value: 'sa', label: 'संस्कृतम्' },
  { value: 'ne', label: 'नेपाली' },
  { value: 'si', label: 'සිංහල' },
  { value: 'th', label: 'ภาษาไทย' },
  { value: 'my', label: 'မြန်မာ' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
]

const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'TH', label: 'Thailand' },
  { value: 'JP', label: 'Japan' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'SG', label: 'Singapore' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'CA', label: 'Canada' },
  { value: 'NP', label: 'Nepal' },
  { value: 'MM', label: 'Myanmar' },
  { value: 'KH', label: 'Cambodia' },
  { value: 'VN', label: 'Vietnam' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface OnboardState {
  traditions: Set<string>
  languages: Set<string>
  interests: Set<string>
  purposes: Set<string>
  profession: string | null
  customProfession: string
  city: string
  country: string
  appLang: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const { token, updateUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profOpen, setProfOpen] = useState(false)
  const profComboRef = useRef<HTMLDivElement>(null)

  const [ob, setOb] = useState<OnboardState>({
    traditions: new Set(),
    languages: new Set(),
    interests: new Set(),
    purposes: new Set(),
    profession: null,
    customProfession: '',
    city: '',
    country: '',
    appLang: 'en',
  })

  useEffect(() => { setHydrated(true) }, [])

  useEffect(() => {
    if (hydrated && !token) router.replace('/login')
  }, [hydrated, token, router])

  // Close profession dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (profComboRef.current && !profComboRef.current.contains(e.target as Node)) {
        setProfOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function toggleSetItem(field: 'traditions' | 'languages' | 'interests' | 'purposes', value: string) {
    setOb((prev) => {
      const next = new Set(prev[field])
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return { ...prev, [field]: next }
    })
  }

  function selectLang(lang: string) {
    setOb((prev) => ({ ...prev, appLang: lang }))
  }

  function selectProfession(value: string) {
    setOb((prev) => ({ ...prev, profession: value, customProfession: '' }))
    setProfOpen(false)
  }

  function next() {
    if (step < 5) setStep((s) => s + 1)
    else void finish()
  }

  function prev() {
    if (step > 1) setStep((s) => s - 1)
  }

  async function finish() {
    setSaving(true)
    try {
      const profileData: Record<string, unknown> = {
        preferredLanguage: ob.appLang,
      }
      if (ob.traditions.size) profileData.traditions = [...ob.traditions]
      if (ob.languages.size) profileData.languages = [...ob.languages]
      if (ob.city) profileData.city = ob.city
      if (ob.country) profileData.country = ob.country
      if (ob.profession) profileData.professionType = ob.profession
      if (ob.customProfession) profileData.customProfession = ob.customProfession
      if (ob.interests.size) profileData.interestTags = [...ob.interests]
      if (ob.purposes.size) profileData.intentTags = [...ob.purposes]

      if (Object.keys(profileData).length > 1) {
        const updated = await api.put<User>('/users/me', profileData, token ?? undefined)
        updateUser(updated)
      }
    } catch {
      // non-fatal — proceed to app
    } finally {
      router.replace('/feed')
    }
  }

  function skip() {
    router.replace('/feed')
  }

  // ── Render steps ─────────────────────────────────────────────

  const selectedProfLabel = ob.profession
    ? (PROFESSION_OPTIONS.find((p) => p.value === ob.profession)?.label ?? ob.profession)
    : null

  const nextLabel =
    step === 0 ? 'Continue' : step === 5 ? 'Finish' : 'Next →'

  return (
    <div
      style={{
        background: 'linear-gradient(180deg,var(--surface-bg) 0%,var(--saffron-50) 100%)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <div className="onboard-shell">
        {/* Header */}
        <div className="onboard-header">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={skip}>
            <div className="logo-mark">
              <i className="fa-solid fa-dharmachakra" />
            </div>
            Sangham
          </div>
          <button className="btn btn-ghost btn-sm" onClick={skip}>
            Skip
          </button>
        </div>

        {/* Progress dots (hidden on step 0) */}
        {step > 0 && (
          <div className="onboard-progress">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`onboard-dot${i === step ? ' active' : i < step ? ' done' : ''}`}
              />
            ))}
          </div>
        )}

        {/* ── Step 0: Language ─────────────────────────────────── */}
        {step === 0 && (
          <div className="onboard-step active">
            <div className="onboard-emoji">🌐</div>
            <h2 className="onboard-title">Choose Your Language</h2>
            <p className="onboard-sub">Select the language you&apos;d like to use Sangham in.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              {[
                { value: 'en', name: 'English', native: 'English' },
                { value: 'hi', name: 'हिन्दी', native: 'Hindi' },
                { value: 'mr', name: 'मराठी', native: 'Marathi' },
              ].map((lang) => (
                <button
                  key={lang.value}
                  className={`lang-btn${ob.appLang === lang.value ? ' selected' : ''}`}
                  onClick={() => selectLang(lang.value)}
                >
                  <div>
                    <div className="lang-btn-name">{lang.name}</div>
                    <div className="lang-btn-native">{lang.native}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Tradition ────────────────────────────────── */}
        {step === 1 && (
          <div className="onboard-step active">
            <div className="onboard-emoji">☸️</div>
            <h2 className="onboard-title">Your Background</h2>
            <p className="onboard-sub">All traditions and backgrounds are welcome. Select what applies to you.</p>
            <div className="onboard-label">Tradition (optional)</div>
            <div className="onboard-chips">
              {[
                { value: 'THERAVADA', label: 'Theravada' },
                { value: 'MAHAYANA',  label: 'Mahayana / Zen' },
                { value: 'VAJRAYANA', label: 'Vajrayana / Tibetan' },
                { value: 'NAVAYANA',  label: 'Navayana / Ambedkarite' },
                { value: 'MULTIPLE',  label: 'Multiple Traditions' },
                { value: 'OTHER',     label: 'Other / Secular' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`onboard-chip${ob.traditions.has(value) ? ' selected' : ''}`}
                  onClick={() => toggleSetItem('traditions', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Profession ───────────────────────────────── */}
        {step === 2 && (
          <div className="onboard-step active">
            <div className="onboard-emoji">💼</div>
            <h2 className="onboard-title">Your Profession</h2>

            {/* Combobox */}
            <div className="onboard-combo" ref={profComboRef}>
              <div
                className="onboard-combo-trigger"
                role="combobox"
                tabIndex={0}
                aria-expanded={profOpen}
                aria-haspopup="listbox"
                onClick={() => setProfOpen((o) => !o)}
                onKeyDown={(e) => e.key === 'Enter' && setProfOpen((o) => !o)}
              >
                <span className={selectedProfLabel ? 'onboard-combo-selected' : 'onboard-combo-placeholder'}>
                  {selectedProfLabel ?? 'Select your profession…'}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, color: 'var(--text-tertiary)' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {profOpen && (
                <div className="onboard-combo-list" role="listbox">
                  {PROFESSION_OPTIONS.map((p) => (
                    <div
                      key={p.value}
                      className={`onboard-combo-option${ob.profession === p.value ? ' selected' : ''}`}
                      role="option"
                      onClick={() => selectProfession(p.value)}
                    >
                      {p.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {ob.profession === 'OTHER' && (
              <div style={{ display: 'block', marginTop: 'var(--space-3)' }}>
                <input
                  className="input"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Yoga Instructor, NGO Director"
                  value={ob.customProfession}
                  onChange={(e) => setOb((prev) => ({ ...prev, customProfession: e.target.value }))}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Interests ────────────────────────────────── */}
        {step === 3 && (
          <div className="onboard-step active">
            <div className="onboard-emoji">✨</div>
            <h2 className="onboard-title">Your Interests</h2>
            <p className="onboard-sub">Select topics that matter to you.</p>
            <div className="onboard-chips">
              {INTEREST_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={`onboard-chip${ob.interests.has(value) ? ' selected' : ''}`}
                  onClick={() => toggleSetItem('interests', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Location + Languages ─────────────────────── */}
        {step === 4 && (
          <div className="onboard-step active">
            <div className="onboard-emoji">📍</div>
            <h2 className="onboard-title">Where Are You?</h2>
            <p className="onboard-sub">Helps nearby people find you.</p>
            <div className="input-group">
              <label>City</label>
              <input
                id="ob-city"
                className="input"
                placeholder="e.g. Nagpur"
                value={ob.city}
                onChange={(e) => setOb((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div className="input-group">
              <label>Country</label>
              <select
                id="ob-country"
                className="input"
                value={ob.country}
                onChange={(e) => setOb((prev) => ({ ...prev, country: e.target.value }))}
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="onboard-label">Languages You Speak</div>
            <div className="onboard-chips onboard-chips-sm">
              {SPOKEN_LANGUAGES.map(({ value, label }) => (
                <button
                  key={value}
                  className={`onboard-chip${ob.languages.has(value) ? ' selected' : ''}`}
                  onClick={() => toggleSetItem('languages', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 5: Purpose ──────────────────────────────────── */}
        {step === 5 && (
          <div className="onboard-step active">
            <div className="onboard-emoji">🎯</div>
            <h2 className="onboard-title">Why Are You Here?</h2>
            <p className="onboard-sub">
              We&apos;ll connect you with people, communities, and opportunities that match.
            </p>
            <div className="onboard-purpose-grid">
              {PURPOSE_CATEGORIES.map((cat) => (
                <div key={cat.label}>
                  <div className="onboard-purpose-cat-label">{cat.label}</div>
                  <div className="onboard-chips">
                    {cat.items.map(({ value, label }) => (
                      <button
                        key={value}
                        className={`onboard-chip${ob.purposes.has(value) ? ' selected' : ''}`}
                        onClick={() => toggleSetItem('purposes', value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="onboard-footer">
          {step > 1 && (
            <button className="btn btn-ghost" onClick={prev}>
              ← Back
            </button>
          )}
          <button
            className="btn btn-primary"
            style={{ flex: 1, maxWidth: 200, marginLeft: 'auto' }}
            onClick={next}
            disabled={saving}
          >
            {saving ? <span className="spinner spinner-sm" /> : nextLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
