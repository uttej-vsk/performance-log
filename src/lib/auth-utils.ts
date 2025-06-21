import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

// Server-side utility to require authentication in server components/routes
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }
  return session.user;
}

// Encryption and Decryption for sensitive data like JIRA tokens
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get encryption key with graceful fallback
function getEncryptionKey(): Buffer {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  
  if (!ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('ENCRYPTION_KEY not set. Using development fallback. Set ENCRYPTION_KEY for production.');
      // Use a development fallback key
      return Buffer.from('0'.repeat(64), 'hex');
    }
    throw new Error('ENCRYPTION_KEY environment variable is required for production.');
  }
  
  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY environment variable must be a 64-character hex string.');
  }
  
  return Buffer.from(ENCRYPTION_KEY, 'hex');
}

/**
 * Encrypts a plaintext string.
 * @param text The plaintext to encrypt.
 * @returns The encrypted string in the format "iv:authTag:encryptedData".
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an encrypted string.
 * @param encryptedText The encrypted string in the format "iv:authTag:encryptedData".
 * @returns The decrypted plaintext.
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format.');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedData = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decrypted.toString('utf8');
}
