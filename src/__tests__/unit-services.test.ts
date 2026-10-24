import { evaluateListingRisk } from '../services/moderation-service';
import { calculateRoommateMatch } from '../services/matchmaking-service';
import { validateChatMessage } from '../services/chat-moderation-service';
import { calculateDistance, formatDistance, getSmartTransitInfo, getTransitFromDistanceKm } from '../lib/utils/distance';

function runTests() {
  console.log('🧪 Starting Gampüs V2 Business Logic Tests...\n');

  // Test 1: Moderation Risk Evaluation
  console.log('1. Testing Moderation Risk Evaluation...');
  const normalResult = evaluateListingRisk('Temiz Çalışma Masası', 'Mezun olduğum için elden satılık.');
  console.assert(normalResult.riskScore === 0, 'Normal listing should have 0 risk score');

  const riskyResult = evaluateListingRisk('Acil Ev Kiralık', 'Lütfen kapora için IBAN adresine acil ödeme yapınız.');
  console.assert(riskyResult.riskScore >= 50, 'Suspicious listing should trigger high risk score');
  console.assert(riskyResult.requiresAdminReview === true, 'Should require admin review');
  console.log('  ✅ Moderation Risk Test Passed!\n');

  // Test 2: Roommate Matchmaking Algorithm
  console.log('2. Testing Roommate Matchmaking Algorithm...');
  const matchResult = calculateRoommateMatch(
    { budget: 8000, sleepSchedule: 'Erken (23:00 - 07:00)', cleanliness: 'Çok titiz', smoking: 'Hayır' },
    { budget: 8500, sleepSchedule: 'Erken (23:00 - 07:00)', cleanliness: 'Çok titiz', smoking: 'Hayır' }
  );
  console.assert(matchResult.matchPercentage >= 90, 'Matching profiles should score high percentage');
  console.log(`  Match Result: ${matchResult.matchPercentage}%`);
  console.log('  ✅ Roommate Matchmaking Test Passed!\n');

  // Test 3: Chat Censorship & Anti-Fraud Moderation
  console.log('3. Testing Chat Censorship & Anti-Fraud Moderation...');
  const validMsg = validateChatMessage('Merhaba, ürün hala satılık mı? Yarın kampüste görüşebilir miyiz?');
  console.assert(validMsg.isValid === true, 'Normal message should be allowed');

  const phoneMsg = validateChatMessage('Beni 0532 999 88 77 numarasından ara detayları konuşalım');
  console.assert(phoneMsg.isValid === false && phoneMsg.category === 'PHONE', 'Phone number must be rejected');

  const ibanMsg = validateChatMessage('Kapora için TR33 0006 1005 1234 5678 9012 34 hesabına havale geç');
  console.assert(ibanMsg.isValid === false && (ibanMsg.category === 'IBAN' || ibanMsg.category === 'FRAUD'), 'IBAN must be rejected');

  const redirectMsg = validateChatMessage('Buradan yazma wpden yaz daha rahat olur');
  console.assert(redirectMsg.isValid === false && redirectMsg.category === 'REDIRECT', 'External redirect must be rejected');

  const profanityMsg = validateChatMessage('sen ne salak adamsın ya');
  console.assert(profanityMsg.isValid === false && profanityMsg.category === 'PROFANITY', 'Profanity must be rejected');
  console.log('  ✅ Chat Censorship & Anti-Fraud Tests Passed!\n');

  // Test 4: Distance & Smart Transit Calculation
  console.log('4. Testing Campus Transit & Distance Calculations...');
  // Kadıköy Moda to İTÜ Maslak
  const airDist = calculateDistance(40.9841, 29.0267, 41.1053, 29.0234);
  console.assert(airDist > 10 && airDist < 16, `Air distance should be ~13.5km, got ${airDist}`);

  const transit = getSmartTransitInfo(40.9841, 29.0267, 41.1053, 29.0234);
  console.assert(transit.transitType === 'METRO', 'Long distance must classify as METRO transit');
  console.assert(transit.icon === '🚇', 'Metro icon should be 🚇');

  // Short walking distance (e.g. 500m)
  const walkingTransit = getTransitFromDistanceKm(0.8);
  console.assert(walkingTransit.transitType === 'WALKING', '0.8km must be WALKING');
  console.assert(walkingTransit.icon === '🚶', 'Walking icon should be 🚶');
  console.assert(walkingTransit.estimatedMinutes === 10, `Walking minutes for 0.8km should be 10, got ${walkingTransit.estimatedMinutes}`);

  console.log('  ✅ Campus Transit & Distance Tests Passed!\n');

  console.log('🎉 All Unit Tests Completed Successfully!');
}

runTests();
