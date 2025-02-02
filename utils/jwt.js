// app/jwt.js
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Génère un token signé
 * @param {object} payload - Les données à intégrer dans le token
 * @returns {Promise<string>}
 */
export async function sign(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

/**
 * Vérifie un token et retourne son payload
 * @param {string} token - Le token à vérifier
 * @returns {Promise<object|null>}
 */
export async function verify(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}
