// Client-side AES-GCM encryption for messages.
// Each conversation derives a symmetric key from a server-supplied base key.
// The server stores only ciphertext — it cannot read message content.

const KEY_ALGO = { name: 'AES-GCM', length: 256 } as const
const DERIVE_ALGO = { name: 'PBKDF2', hash: 'SHA-256', iterations: 100_000, salt: new TextEncoder().encode('sangham-v1') } as const

// Derive a conversation key from a shared secret string (e.g. conversation ID + user secret)
export async function deriveKey(secret: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { ...DERIVE_ALGO, salt: new TextEncoder().encode('sangham-msg-v1') },
    raw,
    KEY_ALGO,
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptMessage(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  // Pack iv + ciphertext as base64
  const combined = new Uint8Array(iv.byteLength + ct.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ct), iv.byteLength)
  let binary = ''
  for (let i = 0; i < combined.length; i++) binary += String.fromCharCode(combined[i])
  return btoa(binary)
}

export async function decryptMessage(key: CryptoKey, ciphertext: string): Promise<string> {
  try {
    const bytes = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
    const iv = bytes.slice(0, 12)
    const ct = bytes.slice(12)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
    return new TextDecoder().decode(plain)
  } catch {
    return '[encrypted message]'
  }
}

// Per-device keypair for ECDH (stored in localStorage)
const KEY_STORAGE = 'sangham_keypair_v1'

export async function getOrCreateKeypair(): Promise<{ publicKeyB64: string; privateKey: CryptoKey }> {
  const stored = localStorage.getItem(KEY_STORAGE)
  if (stored) {
    try {
      const { pub, priv } = JSON.parse(stored)
      const privKey = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(priv), (c) => c.charCodeAt(0)), { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey'])
      return { publicKeyB64: pub, privateKey: privKey }
    } catch { /* regenerate */ }
  }
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey'])
  const pub = await crypto.subtle.exportKey('spki', kp.publicKey)
  const priv = await crypto.subtle.exportKey('pkcs8', kp.privateKey)
  const toB64 = (buf: ArrayBuffer) => { const a = new Uint8Array(buf); let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s) }
  const pubB64 = toB64(pub)
  const privB64 = toB64(priv)
  localStorage.setItem(KEY_STORAGE, JSON.stringify({ pub: pubB64, priv: privB64 }))
  return { publicKeyB64: pubB64, privateKey: kp.privateKey }
}

export async function deriveSharedKey(myPrivateKey: CryptoKey, theirPublicKeyB64: string): Promise<CryptoKey> {
  const theirPubRaw = Uint8Array.from(atob(theirPublicKeyB64), (c) => c.charCodeAt(0))
  const theirPub = await crypto.subtle.importKey('spki', theirPubRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  return crypto.subtle.deriveKey({ name: 'ECDH', public: theirPub }, myPrivateKey, KEY_ALGO, false, ['encrypt', 'decrypt'])
}
