// HB-Auth Crypto utilities
// Encrypts and decrypts private keys using Web Crypto API

const STORAGE_KEY = 'hbauth-keys'
const SALT_LENGTH = 16
const IV_LENGTH = 12

interface StoredKey {
  username: string
  encryptedKey: string // base64
  salt: string // base64
  iv: string // base64
  keyType: 'posting' | 'active'
}

interface StoredData {
  keys: StoredKey[]
}

// Derive encryption key from password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypt private key with password
async function encryptKey(privateKey: string, password: string): Promise<{ encrypted: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)

  const encoder = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(privateKey)
  )

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
  }
}

// Decrypt private key with password
async function decryptKey(encryptedData: string, salt: string, iv: string, password: string): Promise<string> {
  const saltArray = new Uint8Array(atob(salt).split('').map(c => c.charCodeAt(0)))
  const ivArray = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)))
  const encryptedArray = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)))

  const key = await deriveKey(password, saltArray)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivArray },
    key,
    encryptedArray
  )

  return new TextDecoder().decode(decrypted)
}

// Get stored data from localStorage
function getStoredData(): StoredData {
  if (typeof localStorage === 'undefined') return { keys: [] }
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return { keys: [] }
  try {
    return JSON.parse(data)
  } catch {
    return { keys: [] }
  }
}

// Save data to localStorage
function saveStoredData(data: StoredData): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Check if user has a stored key
export function hasStoredKey(username: string): boolean {
  const data = getStoredData()
  return data.keys.some(k => k.username.toLowerCase() === username.toLowerCase())
}

// Get list of stored usernames
export function getStoredUsernames(): string[] {
  const data = getStoredData()
  return data.keys.map(k => k.username)
}

// Store encrypted key
export async function storeKey(
  username: string,
  privateKey: string,
  password: string,
  keyType: 'posting' | 'active' = 'posting'
): Promise<void> {
  const { encrypted, salt, iv } = await encryptKey(privateKey, password)

  const data = getStoredData()

  // Remove existing key for this user if any
  data.keys = data.keys.filter(k => k.username.toLowerCase() !== username.toLowerCase())

  // Add new key
  data.keys.push({
    username: username.toLowerCase(),
    encryptedKey: encrypted,
    salt,
    iv,
    keyType,
  })

  saveStoredData(data)
}

// Unlock and get private key
export async function unlockKey(username: string, password: string): Promise<{ privateKey: string; keyType: 'posting' | 'active' }> {
  const data = getStoredData()
  const stored = data.keys.find(k => k.username.toLowerCase() === username.toLowerCase())

  if (!stored) {
    throw new Error('No key found for this username')
  }

  try {
    const privateKey = await decryptKey(stored.encryptedKey, stored.salt, stored.iv, password)
    return { privateKey, keyType: stored.keyType }
  } catch {
    throw new Error('Invalid password')
  }
}

// Remove stored key
export function removeKey(username: string): void {
  const data = getStoredData()
  data.keys = data.keys.filter(k => k.username.toLowerCase() !== username.toLowerCase())
  saveStoredData(data)
}

// Validate WIF format (basic check)
export function isValidWIF(wif: string): boolean {
  // WIF private keys start with 5 and are 51 characters
  return wif.startsWith('5') && wif.length === 51
}
