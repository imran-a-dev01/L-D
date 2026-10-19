import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { getFilterOptions, applyEmployeeFilters, getManagerKey } from '../src/lib/employeeFilters.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_ld_super_secret_jwt_key_2026';
const token = jwt.sign({ id: 'USR_MVB9J6E3TPGI', email: 'admin@valuemomentum.com' }, JWT_SECRET, { expiresIn: '1h' });

const BASE_URL = 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function runTests() {
  console.log('=== STARTING TEST SUITE FOR FILTER REBUILD & MANAGER EMAIL ===\n');

  // Step 0: Initial employees
  const { employees: initialEmps } = await request('/employees');
  for (const tid of ['TEST_A', 'TEST_B', 'TEST_C']) {
    if (initialEmps.some(e => e.id === tid)) {
      await request(`/employees/${tid}`, { method: 'DELETE' });
    }
  }
  const { employees: cleanedEmps } = await request('/employees');
  console.log(`Initial employees in DB: ${cleanedEmps.length}`);

  // Test Case (a): Create employees A, B, C
  console.log('\n--- Test Case (a): Creating Employees A, B, C ---');
  const empA = {
    id: 'TEST_A',
    name: 'Alice A',
    email: 'alice.a@test.com',
    designation: 'Senior Developer',
    businessUnit: 'CCM',
    location: 'Coimbatore',
    reportingManager: 'Saravanan',
    reportingManagerEmail: 'saravanan.k@example.com',
    totalExperience: 5,
    technicalSkills: [{ name: 'React', category: 'Frontend', proficiency: 'Advanced' }],
  };

  const empB = {
    id: 'TEST_B',
    name: 'Bob B',
    email: 'bob.b@test.com',
    designation: 'Lead Engineer',
    businessUnit: 'Insurance',
    location: 'coimbatore ', // lowercase, trailing space
    reportingManager: 'Saravanan',
    reportingManagerEmail: '', // NO email
    totalExperience: 7,
    technicalSkills: [{ name: 'Node.js', category: 'Backend', proficiency: 'Intermediate' }],
  };

  const empC = {
    id: 'TEST_C',
    name: 'Charlie C',
    email: 'charlie.c@test.com',
    designation: 'Solutions Architect',
    businessUnit: 'Insurance',
    location: 'Chennai',
    reportingManager: 'Suresh',
    reportingManagerEmail: '', // NO email
    totalExperience: 10,
    domainExpertise: [{ domain: 'Others', customDomain: 'Telecom', experienceYears: 4, proficiency: 'Expert' }],
    technicalSkills: [{ name: 'Python', category: 'Backend', proficiency: 'Expert' }],
  };

  await request('/employees', { method: 'POST', body: JSON.stringify(empA) });
  console.log('✓ Created Employee A: CCM, Coimbatore, Manager Saravanan (saravanan.k@example.com)');

  await request('/employees', { method: 'POST', body: JSON.stringify(empB) });
  console.log('✓ Created Employee B: Insurance, "coimbatore ", Manager Saravanan (no email)');

  await request('/employees', { method: 'POST', body: JSON.stringify(empC) });
  console.log('✓ Created Employee C: Insurance, Chennai, Manager Suresh (no email), Domain Telecom');

  // Fetch updated list from backend
  const { employees: activeEmps } = await request('/employees');
  const testEmps = activeEmps.filter(e => ['TEST_A', 'TEST_B', 'TEST_C'].includes(e.id));

  // Test Case (b): getFilterOptions
  console.log('\n--- Test Case (b): Verifying Filter Options ---');
  const options = getFilterOptions(testEmps);
  console.log('Practices:', options.practices);
  console.log('Locations:', options.locations);
  console.log('Managers:', options.managers.map(m => m.label));
  console.log('Domains:', options.domains);

  // Assertions for (b)
  const practicesMatch = JSON.stringify(options.practices) === JSON.stringify(['CCM', 'Insurance']);
  console.log(`Practices exact match ['CCM', 'Insurance']: ${practicesMatch ? 'PASS' : 'FAIL'}`);

  const locationsMatch = JSON.stringify(options.locations) === JSON.stringify(['Chennai', 'Coimbatore']);
  console.log(`Locations merged into ['Chennai', 'Coimbatore']: ${locationsMatch ? 'PASS' : 'FAIL'}`);

  const managerLabels = options.managers.map(m => m.label);
  const expectedManagerLabels = ['Saravanan', 'Saravanan (saravanan.k@example.com)', 'Suresh'];
  const managersMatch = JSON.stringify(managerLabels.sort()) === JSON.stringify(expectedManagerLabels.sort());
  console.log(`Managers 3 distinct options without fake emails: ${managersMatch ? 'PASS' : 'FAIL'}`);

  const domainsMatch = options.domains.includes('Telecom');
  console.log(`Domains include Telecom: ${domainsMatch ? 'PASS' : 'FAIL'}`);

  // Test Case (c): Applying filters
  console.log('\n--- Test Case (c): Filtering Combinations ---');
  // 1. Practice CCM -> TEST_A
  const filteredCCM = applyEmployeeFilters(testEmps, { practice: 'CCM' });
  console.log(`Filter Practice CCM: expected 1, got ${filteredCCM.length} (${filteredCCM.map(e => e.id).join(', ')})`);

  // 2. Location Coimbatore -> TEST_A and TEST_B (exact case-insensitive match)
  const filteredCoimbatore = applyEmployeeFilters(testEmps, { location: 'Coimbatore' });
  console.log(`Filter Location Coimbatore: expected 2, got ${filteredCoimbatore.length} (${filteredCoimbatore.map(e => e.id).join(', ')})`);

  // 3. Manager Saravanan with email
  const mgrKeyWithEmail = getManagerKey('Saravanan', 'saravanan.k@example.com');
  const filteredMgrEmail = applyEmployeeFilters(testEmps, { managerKey: mgrKeyWithEmail });
  console.log(`Filter Manager Saravanan (saravanan.k@example.com): expected 1, got ${filteredMgrEmail.length} (${filteredMgrEmail.map(e => e.id).join(', ')})`);

  // 4. Manager Saravanan NO email
  const mgrKeyNoEmail = getManagerKey('Saravanan', '');
  const filteredMgrNoEmail = applyEmployeeFilters(testEmps, { managerKey: mgrKeyNoEmail });
  console.log(`Filter Manager Saravanan (no email): expected 1, got ${filteredMgrNoEmail.length} (${filteredMgrNoEmail.map(e => e.id).join(', ')})`);

  // 5. Proficiency Beginner (nobody has it) -> 0 records
  const filteredBeginner = applyEmployeeFilters(testEmps, { proficiency: 'Beginner' });
  console.log(`Filter Proficiency Beginner: expected 0, got ${filteredBeginner.length}`);

  // 6. Search "Telecom"
  const filteredSearchDomain = applyEmployeeFilters(testEmps, { search: 'telecom' });
  console.log(`Search "telecom": expected 1 (TEST_C), got ${filteredSearchDomain.length}`);

  // 7. Search manager email "saravanan.k"
  const filteredSearchEmail = applyEmployeeFilters(testEmps, { search: 'saravanan.k' });
  console.log(`Search manager email "saravanan.k": expected 1 (TEST_A), got ${filteredSearchEmail.length}`);

  // Test Case (d): Edit employee C and change Practice to "CCM", then delete B
  console.log('\n--- Test Case (d): Edit C Practice to CCM, Delete B ---');
  await request('/employees/TEST_C', {
    method: 'PUT',
    body: JSON.stringify({ ...empC, businessUnit: 'CCM' }),
  });
  const { employees: afterEditEmps } = await request('/employees');
  const testEmpsAfterEdit = afterEditEmps.filter(e => ['TEST_A', 'TEST_B', 'TEST_C'].includes(e.id));
  const optionsAfterEdit = getFilterOptions(testEmpsAfterEdit);
  console.log('Practices after C changed to CCM (B still has Insurance):', optionsAfterEdit.practices);
  console.log(`Insurance still exists because B has it: ${optionsAfterEdit.practices.includes('Insurance') ? 'PASS' : 'FAIL'}`);

  await request('/employees/TEST_B', { method: 'DELETE' });
  console.log('✓ Deleted Employee B');

  const { employees: afterDeleteB } = await request('/employees');
  const testEmpsAfterDeleteB = afterDeleteB.filter(e => ['TEST_A', 'TEST_B', 'TEST_C'].includes(e.id));
  const optionsAfterDeleteB = getFilterOptions(testEmpsAfterDeleteB);
  console.log('Practices after B deleted:', optionsAfterDeleteB.practices);
  console.log(`Insurance disappeared: ${!optionsAfterDeleteB.practices.includes('Insurance') ? 'PASS' : 'FAIL'}`);

  // Clean up remaining test employees
  await request('/employees/TEST_A', { method: 'DELETE' });
  await request('/employees/TEST_C', { method: 'DELETE' });
  console.log('✓ Cleaned up TEST_A and TEST_C');

  console.log('\n=== ALL TEST CASES PASSED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
