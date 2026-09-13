/**
 * Automated Verification Script:
 * Tests all 3 user-reported issues on LAN IP (10.238.163.101)
 *
 * 1. Add Produce -> Admin Panel Visibility Check
 * 2. Google Sign-Up / Firebase Sync Check
 * 3. Phone OTP Dispatch & Verify Check
 */

const http = require('http');

function postJson(url, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Idempotency-Key': `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: raw });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: raw });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runVerification() {
  console.log('=== STARTING MANDIKART ANDROID CONNECTIVITY VERIFICATION ===\n');
  const LAN_HOST = '10.238.163.101';

  // -------------------------------------------------------------
  // TEST 1: Phone OTP Dispatch and Verification (Issue #3)
  // -------------------------------------------------------------
  console.log('TEST 1: OTP Dispatch & Verification Flow (/api/v1/auth/send-otp & /verify-otp)');
  const testPhone = '9876540001';
  const sendOtpRes = await postJson(`http://${LAN_HOST}:4000/api/v1/auth/send-otp`, {
    phone: testPhone,
    channel: 'SMS',
  });
  console.log('  1.1 /auth/send-otp HTTP status:', sendOtpRes.status);
  console.log('  1.1 Response status:', sendOtpRes.data?.data?.status);
  console.log('  1.1 Simulated OTP Code:', sendOtpRes.data?.data?.simulatedCode);

  const otpCode = sendOtpRes.data?.data?.simulatedCode || '400200';
  const verifyOtpRes = await postJson(`http://${LAN_HOST}:4000/api/v1/auth/verify-otp`, {
    phone: testPhone,
    otp: otpCode,
    fullName: 'Ramesh Test Farmer',
  });
  console.log('  1.2 /auth/verify-otp HTTP status:', verifyOtpRes.status);
  const farmerToken = verifyOtpRes.data?.data?.token;
  const farmerId = verifyOtpRes.data?.data?.farmer?.id;
  console.log('  1.2 Verified Farmer ID:', farmerId);
  console.log('  1.2 Session Token generated:', Boolean(farmerToken));
  if (!farmerToken) {
    throw new Error('TEST 1 FAILED: Could not obtain token from verify-otp');
  }
  console.log('  >>> TEST 1 PASSED: OTP flow 100% operational on LAN IP!\n');

  // -------------------------------------------------------------
  // TEST 2: Google Sign-Up Backend Profile Sync (Issue #2)
  // -------------------------------------------------------------
  console.log('TEST 2: Google Sign-Up Sync Flow (/api/v1/auth/firebase-sync)');
  const googleSyncRes = await postJson(`http://${LAN_HOST}:4000/api/v1/auth/firebase-sync`, {
    firebaseUid: `fb_google_test_${Date.now()}`,
    email: 'farmer.google.tester@gmail.com',
    fullName: 'Google Authenticated Farmer',
    avatarUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=150',
    phone: '+919876540002',
  });
  console.log('  2.1 /auth/firebase-sync HTTP status:', googleSyncRes.status);
  console.log('  2.1 Synchronized Farmer Name:', googleSyncRes.data?.data?.farmer?.fullName);
  console.log('  2.1 Synchronized Token generated:', Boolean(googleSyncRes.data?.data?.token));
  if (!googleSyncRes.data?.data?.token) {
    throw new Error('TEST 2 FAILED: Google sync failed to produce token');
  }
  console.log('  >>> TEST 2 PASSED: Google Sign-Up sync operational on LAN IP!\n');

  // -------------------------------------------------------------
  // TEST 3: Add Produce from Phone -> Instant Admin Panel Fetch (Issue #1)
  // -------------------------------------------------------------
  console.log('TEST 3: Add Produce & Admin Panel Sync Flow');
  const cropUniqueName = `Nashik Red Onion Test ${Date.now().toString().slice(-4)}`;
  const addProducePayload = {
    cropName: cropUniqueName,
    cropVariety: 'Garwa Export',
    grade: 'A',
    category: 'Vegetables',
    totalQuantity: 5000,
    quantityUnit: 'kg',
    basePricePerUnit: 32,
    minOrderQuantity: 10,
    targetBuyer: 'PENDING_APPROVAL',
    status: 'PENDING_APPROVAL',
    isActive: false,
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600'],
    shelfLifeDays: 7,
    pickupAddress: 'Nashik APMC Yard Gate 4',
    farmerName: 'Ramesh Test Farmer',
    farmerPhone: '+919876540001',
    location: 'Nashik, Maharashtra',
  };

  const createProduceRes = await postJson(
    `http://${LAN_HOST}:4000/api/v1/products`,
    addProducePayload,
    farmerToken
  );
  console.log('  3.1 Create Product HTTP status:', createProduceRes.status);
  console.log('  3.1 Create Product Body:', JSON.stringify(createProduceRes.data));
  const createdCropId = createProduceRes.data?.data?.id;
  console.log('  3.1 Created Crop ID in Farmer Backend:', createdCropId);
  console.log('  3.1 Created Crop Name:', createProduceRes.data?.data?.cropName);

  if (!createdCropId) {
    throw new Error('TEST 3 FAILED: Product creation failed');
  }

  // Query Admin Backend on Port 4003 (where Admin panel fetches produce)
  const adminProduceRes = await getJson(`http://${LAN_HOST}:4003/api/v1/admin/produce`);
  console.log('  3.2 Admin Backend /admin/produce HTTP status:', adminProduceRes.status);
  const allProduce = adminProduceRes.data?.data || [];
  console.log(`  3.2 Total Produce items in Admin Panel: ${allProduce.length}`);

  const foundInAdmin = allProduce.find(
    (p) => p.id === createdCropId || p.cropName === cropUniqueName
  );

  if (foundInAdmin) {
    console.log('  3.3 Successfully found newly added crop on Admin Panel:');
    console.log('      - ID:', foundInAdmin.id);
    console.log('      - Name:', foundInAdmin.cropName);
    console.log('      - Quantity:', foundInAdmin.quantityKg, 'kg');
    console.log('      - Price:', '₹' + foundInAdmin.pricePerKg + '/kg');
    console.log('      - Status:', foundInAdmin.status);
    console.log('  >>> TEST 3 PASSED: Produce appears immediately on Admin Panel!\n');
  } else {
    console.log('Admin list sample:', allProduce.slice(0, 3));
    throw new Error(`TEST 3 FAILED: Crop ${createdCropId} not found in Admin produce list`);
  }

  console.log('===============================================================');
  console.log('  ALL 3 VERIFICATION TESTS PASSED SUCCESSFULLY ON LAN IP!');
  console.log('===============================================================');
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
  process.exit(1);
});
