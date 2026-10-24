import { hashPassword, comparePassword, createToken, verifyToken, UserSessionPayload } from '../lib/auth';
import { validateChatMessage } from '../services/chat-moderation-service';
import { registerSchema, createListingSchema, loginSchema, reviewSchema } from '../lib/validation';
import crypto from 'crypto';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
}

async function runSecurityAuditTests() {
  console.log('🔒 Starting Gampüs Production Security Audit Tests...\n');

  // ==========================================
  // 1. AUTH & JWT SECURITY TESTS
  // ==========================================
  console.log('1. Testing Auth & JWT Security...');

  // 1.1 Password Hashing & Verification
  const rawPw = 'SuperSecretP@ssw0rd!2026';
  const hash = await hashPassword(rawPw);
  assert(hash !== rawPw, 'Hash must not match raw password');
  assert(hash.startsWith('$2'), 'Hash must be a valid bcrypt hash');
  assert(await comparePassword(rawPw, hash), 'Correct password must verify');
  assert(!(await comparePassword('WrongPassword', hash)), 'Wrong password must be rejected');

  // 1.2 JWT Token Generation & Verification
  const userPayload: UserSessionPayload = {
    id: 'test-user-123',
    email: 'test@itu.edu.tr',
    name: 'Test Öğrenci',
    role: 'USER',
    studentVerified: true,
    universityId: 'uni-itu',
  };

  const validToken = await createToken(userPayload);
  const verified = await verifyToken(validToken);
  assert(verified !== null && verified.id === userPayload.id, 'Valid token must be decoded correctly');

  // 1.3 Malformed & Tampered Token
  const tamperedToken = validToken.substring(0, validToken.length - 6) + 'xxxxxx';
  const tamperedResult = await verifyToken(tamperedToken);
  assert(tamperedResult === null, 'Tampered token must be rejected');

  const randomStringToken = 'not.a.valid.jwt';
  assert((await verifyToken(randomStringToken)) === null, 'Malformed token must return null');

  // 1.4 Admin Role Verification
  const adminPayload: UserSessionPayload = {
    ...userPayload,
    role: 'ADMIN',
  };
  const adminToken = await createToken(adminPayload);
  const verifiedAdmin = await verifyToken(adminToken);
  assert(verifiedAdmin?.role === 'ADMIN', 'Admin token must retain ADMIN role');
  assert(verified?.role === 'USER', 'Normal user token must not have ADMIN role');
  console.log('  ✅ Auth & JWT Security Passed!\n');

  // ==========================================
  // 2. INPUT VALIDATION & OVERSIZED PAYLOADS
  // ==========================================
  console.log('2. Testing Input Validation & Payload Limits...');

  // 2.1 Login validation
  assert(!loginSchema.safeParse({ email: 'invalid-email', password: '' }).success, 'Invalid email/empty password must fail');
  assert(loginSchema.safeParse({ email: 'student@itu.edu.tr', password: 'password123' }).success, 'Valid login payload must pass');

  // 2.2 Register validation
  const shortPwRegister = registerSchema.safeParse({
    name: 'Ali',
    email: 'ali@itu.edu.tr',
    password: '123', // Too short (< 8 chars)
  });
  assert(!shortPwRegister.success, 'Short password must fail register schema');

  // 2.3 Oversized listing payload protection
  const hugeDescription = 'A'.repeat(5000); // Max is 3000
  const invalidListing = createListingSchema.safeParse({
    category: 'HOUSE',
    title: 'Kadıköy 2+1 Ev',
    description: hugeDescription,
    price: 15000,
    district: 'Kadıköy',
    locationText: 'Moda',
    latitude: 41.0,
    longitude: 29.0,
    images: ['https://example.com/photo.jpg'],
  });
  assert(!invalidListing.success, 'Oversized description (> 3000 chars) must be rejected');

  // 2.4 Negative or zero price
  const negativePriceListing = createListingSchema.safeParse({
    category: 'HOUSE',
    title: 'Kadıköy 2+1 Ev',
    description: 'Güzel ve temiz bir öğrenci evi.',
    price: -500,
    district: 'Kadıköy',
    locationText: 'Moda',
    latitude: 41.0,
    longitude: 29.0,
    images: ['https://example.com/photo.jpg'],
  });
  assert(!negativePriceListing.success, 'Negative price must be rejected');

  // 2.5 Review bounds (rating 1 - 5)
  assert(!reviewSchema.safeParse({ reviewedUserId: 'u1', rating: 6, communicationRating: 3, accuracyRating: 4, reliabilityRating: 5 }).success, 'Rating > 5 must fail');
  assert(!reviewSchema.safeParse({ reviewedUserId: 'u1', rating: 0, communicationRating: 3, accuracyRating: 4, reliabilityRating: 5 }).success, 'Rating < 1 must fail');
  console.log('  ✅ Input Validation & Payload Limits Passed!\n');

  // ==========================================
  // 3. CHAT MODERATION & CENSORSHIP
  // ==========================================
  console.log('3. Testing Chat Moderation & Fraud Prevention...');

  // 3.1 Normal messages
  assert(validateChatMessage('Merhaba, yarın kampüste buluşabilir miyiz?').isValid, 'Normal message must pass');

  // 3.2 IBAN / Wire fraud
  assert(!validateChatMessage('Kapora için TR33 0006 1005 1234 5678 9012 34 hesabına havale at').isValid, 'IBAN must be rejected');

  // 3.3 Phone number leaks
  assert(!validateChatMessage('Beni 0532 123 45 67 numarasından ara').isValid, 'Phone number must be rejected');
  assert(!validateChatMessage('Numaram: 0 5 4 4 1 2 3 4 5 6 7').isValid, 'Spaced phone evasion must be rejected');

  // 3.4 Off-platform redirection
  assert(!validateChatMessage('Buradan konuşmayalım whatsapptan yaz').isValid, 'WhatsApp redirection must be rejected');

  // 3.5 Profanity
  assert(!validateChatMessage('sen ne salak adamsın').isValid, 'Profanity must be rejected');
  console.log('  ✅ Chat Moderation Passed!\n');

  // ==========================================
  // 4. PASSWORD RESET TOKEN CRYPTO HASHING
  // ==========================================
  console.log('4. Testing Password Reset Token Hashing...');

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const verifyHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const wrongHash = crypto.createHash('sha256').update('wrong_token_123').digest('hex');

  assert(hashedToken === verifyHash, 'Token hash match must succeed');
  assert(hashedToken !== wrongHash, 'Wrong token hash must not match');
  assert(hashedToken !== rawToken, 'Stored token must be different from raw transmission token');
  console.log('  ✅ Password Reset Token Hashing Passed!\n');

  console.log('🎉 ALL SECURITY AUDIT TESTS PASSED SUCCESSFULLY!');
}

runSecurityAuditTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

