const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: body ? JSON.parse(body) : {} });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING BACKEND TESTS ---');
  let failures = 0;

  // 1. GET /api/employees without token
  const res1 = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/employees',
    method: 'GET'
  });
  console.log('1. GET /api/employees without auth token:', res1.status === 200 ? 'PASS' : `FAIL (${res1.status})`);
  if (res1.status !== 200) failures++;

  // 2. GET /api/employees/UNKNOWN_ID
  const res2 = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/employees/UNKNOWN_ID_9999',
    method: 'GET'
  });
  console.log('2. GET /api/employees/UNKNOWN_ID returns 404:', res2.status === 404 ? 'PASS' : `FAIL (${res2.status})`);
  if (res2.status !== 404) failures++;

  // 3. Validation: Space in ID
  const res3 = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/employees',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: 'EMP 123',
    name: 'Invalid ID',
    email: 'valid@example.com'
  });
  console.log('3. POST with space in ID rejected (400):', res3.status === 400 ? 'PASS' : `FAIL (${res3.status})`);
  if (res3.status !== 400) failures++;

  // 4. Validation: Invalid email
  const res4 = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/employees',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: 'EMP123',
    name: 'Invalid Email',
    email: 'not-an-email'
  });
  console.log('4. POST with invalid email rejected (400):', res4.status === 400 ? 'PASS' : `FAIL (${res4.status})`);
  if (res4.status !== 400) failures++;

  // 5. POST new employee with mixed case ID and full data
  const testEmp = {
    id: '  tEsT-eMp-888  ',
    name: 'Automated Tester',
    email: 'autotester888@testcorp.com',
    designation: 'Senior QA Engineer',
    businessUnit: 'Banking & Financial Services',
    reportingManager: 'Alice Smith',
    reportingManagerEmail: 'alice.smith@testcorp.com',
    currentProject: 'Risk Core 2.0',
    currentCustomer: 'Global Bank',
    location: 'Bangalore',
    totalExperience: 6,
    currentRole: 'Automation Lead',
    owlSureDesignation: 'Principal Specialist',
    deployableRoles: ['SDET Lead', 'Performance Engineer'],
    technicalSkills: [
      { skill: 'TypeScript', proficiency: 'Advanced', experienceYears: 5, category: 'Frontend' },
      { skill: 'Playwright', proficiency: 'Expert', experienceYears: 4, category: 'Testing' }
    ],
    domainExpertise: [
      { domain: 'Core Banking', proficiency: 'Advanced', experienceYears: 4 }
    ],
    immediateTechnologies: ['GraphQL', 'Docker'],
    learningTechnologies: ['Rust']
  };

  const res5 = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/employees',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, testEmp);

  console.log('5. POST create employee returns 201:', res5.status === 201 ? 'PASS' : `FAIL (${res5.status})`);
  if (res5.status !== 201) failures++;

  const created = res5.body.employee;
  console.log('   Normalized ID in returned object:', created?.id === 'TEST-EMP-888' ? 'PASS' : `FAIL (${created?.id})`);
  console.log('   Server computed completion:', created?.profileCompletion, 'status:', created?.status);
  console.log('   Child skills stored with normalized ID:', created?.technicalSkills?.length === 2 ? 'PASS' : 'FAIL');
  console.log('   Child deployableRoles stored:', created?.deployableRoles?.length === 2 ? 'PASS' : 'FAIL');
  console.log('   Child domainExpertise stored:', created?.domainExpertise?.length === 1 ? 'PASS' : 'FAIL');

  // 6. Case-insensitive lookup: GET /api/employees/test-emp-888
  const res6 = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/employees/test-emp-888',
    method: 'GET'
  });
  console.log('6. GET case-insensitive ID lookup returns 200:', res6.status === 200 ? 'PASS' : `FAIL (${res6.status})`);
  if (res6.status !== 200) failures++;
  console.log('   Fetched normalized ID:', res6.body.employee?.id === 'TEST-EMP-888' ? 'PASS' : 'FAIL');

  // 7. PUT update employee
  const updatedEmp = {
    ...res6.body.employee,
    location: 'Hyderabad',
    technicalSkills: [
      ...res6.body.employee.technicalSkills,
      { skill: 'Node.js', proficiency: 'Intermediate', experienceYears: 3, category: 'Backend' }
    ]
  };
  const res7 = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/employees/TEST-EMP-888',
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, updatedEmp);
  console.log('7. PUT update returns 200:', res7.status === 200 ? 'PASS' : `FAIL (${res7.status})`);
  if (res7.status !== 200) failures++;
  console.log('   Updated location:', res7.body.employee?.location === 'Hyderabad' ? 'PASS' : 'FAIL');
  console.log('   Updated technicalSkills count:', res7.body.employee?.technicalSkills?.length === 3 ? 'PASS' : 'FAIL');

  // 8. Unique email 409 check on new employee
  const res8 = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/employees',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: 'DIFFERENT-ID-999',
    name: 'Duplicate Email Person',
    email: 'autotester888@testcorp.com'
  });
  console.log('8. POST with existing email rejected (409):', res8.status === 409 ? 'PASS' : `FAIL (${res8.status})`);
  if (res8.status !== 409) failures++;

  // 9. Reset system endpoint rejected (403) when ALLOW_SYSTEM_RESET=false
  const res9 = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/employees/reset',
    method: 'POST'
  });
  console.log('9. POST /api/employees/reset rejected (403):', res9.status === 403 ? 'PASS' : `FAIL (${res9.status})`);
  if (res9.status !== 403) failures++;

  // 10. Clean up test employee
  const res10 = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/employees/TEST-EMP-888',
    method: 'DELETE'
  });
  console.log('10. DELETE clean up test employee:', res10.status === 200 ? 'PASS' : `FAIL (${res10.status})`);

  console.log(`--- BACKEND TESTS FINISHED: ${failures === 0 ? 'ALL PASSED' : failures + ' FAILED'} ---`);
  process.exit(failures === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
