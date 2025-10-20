// Helper functions to convert between ArrayBuffer and Base64URL
const base64url = {
  encode: (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  },
  decode: (base64urlString: string): ArrayBuffer => {
    const base64 = base64urlString.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64.padEnd(base64.length + padLength, '=');
    const binary_string = atob(padded);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    // Fix: Cast ArrayBufferLike to ArrayBuffer as the return type expects it.
    return bytes.buffer as ArrayBuffer;
  }
};

const getUserId = (): ArrayBuffer => {
    let userIdString = localStorage.getItem('biometricUserId');
    if (!userIdString) {
        const randomBytes = crypto.getRandomValues(new Uint8Array(16));
        // Fix: Cast ArrayBufferLike to ArrayBuffer as encode function expects it.
        userIdString = base64url.encode(randomBytes.buffer as ArrayBuffer);
        localStorage.setItem('biometricUserId', userIdString);
    }
    return base64url.decode(userIdString);
};

export const isBiometricSupported = (): boolean => {
  return !!(navigator.credentials && navigator.credentials.create && window.PublicKeyCredential);
};

export const registerCredential = async (): Promise<string> => {
  if (!isBiometricSupported()) {
    throw new Error('Biometric authentication is not supported on this browser.');
  }

  const userId = getUserId();
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        name: 'Life Sync',
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: 'user@lifesync.app', // A generic, non-identifiable name
        displayName: 'Life Sync User',
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use built-in authenticators like Face ID / Touch ID / Windows Hello
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
    },
  });

  if (!credential || !('rawId' in credential)) {
      throw new Error('Credential creation failed. Please try again.');
  }

  return base64url.encode((credential as any).rawId);
};

export const authenticate = async (credentialId: string): Promise<boolean> => {
  if (!isBiometricSupported()) {
    throw new Error('Biometric authentication is not supported.');
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{
          type: 'public-key',
          id: base64url.decode(credentialId),
        }],
        userVerification: 'required',
      },
    });

    return !!credential;
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
};