const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`${res.statusCode}: ${chunks}`));
        } else {
          resolve(JSON.parse(chunks));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const employees = [
  {
    id: '105512',
    name: 'Saravanan R',
    email: 'saravanan.r@valuemomentum.com',
    designation: 'Senior Director',
    businessUnit: 'CCM',
    reportingManager: 'Rajesh Venkataraman',
    reportingManagerEmail: 'rajesh.v@valuemomentum.com',
    currentProject: 'Policy Administration Suite',
    currentCustomer: 'Liberty Mutual',
    location: 'Coimbatore',
    totalExperience: 18,
    currentRole: 'Delivery Head',
    owlSureDesignation: 'Senior Director',
    deployableRoles: ['Delivery Head', 'Program Manager', 'Solution Architect'],
    technicalSkills: [
      { id: 'sk_01', category: 'Backend', name: 'Java', proficiency: 'Expert', experienceYears: 15, lastUsed: 'Oct 2026', lastProject: 'Policy Administration Suite' },
      { id: 'sk_02', category: 'Cloud', name: 'AWS', proficiency: 'Advanced', experienceYears: 6, lastUsed: 'Sep 2026', lastProject: 'Cloud Migration' },
      { id: 'sk_03', category: 'Frontend', name: 'Angular', proficiency: 'Advanced', experienceYears: 5, lastUsed: 'Aug 2026' },
      { id: 'sk_04', category: 'Database', name: 'Oracle', proficiency: 'Expert', experienceYears: 12, lastUsed: 'Oct 2026' },
    ],
    domainExpertise: [
      { id: 'de_01', domain: 'Insurance', experienceYears: 14, proficiency: 'Expert', lastUsed: 'Oct 2026', lastProject: 'Policy Administration Suite', specialization: 'P&C Policy Lifecycle' },
      { id: 'de_02', domain: 'Banking', experienceYears: 4, proficiency: 'Advanced', lastUsed: 'Mar 2024', lastProject: 'Core Banking Modernization' },
    ],
    immediateTechnologies: ['Java', 'Spring Boot', 'AWS', 'Angular', 'Oracle'],
    learningTechnologies: ['Kubernetes', 'Terraform'],
    profileCompletion: 95,
    status: 'Complete',
    updatedAt: '19 Oct 2026, 10:00',
  },
  {
    id: '105513',
    name: 'Priya Natarajan',
    email: 'priya.n@valuemomentum.com',
    designation: 'Technical Lead',
    businessUnit: 'CCM',
    reportingManager: 'Saravanan R',
    reportingManagerEmail: 'saravanan.r@valuemomentum.com',
    currentProject: 'Claims Processing Engine',
    currentCustomer: 'Nationwide',
    location: 'Coimbatore',
    totalExperience: 8,
    currentRole: 'Tech Lead',
    owlSureDesignation: 'Technical Lead',
    deployableRoles: ['Tech Lead', 'Senior Developer', 'Scrum Master'],
    technicalSkills: [
      { id: 'sk_05', category: 'Frontend', name: 'React', proficiency: 'Expert', experienceYears: 5, lastUsed: 'Oct 2026', lastProject: 'Claims Processing Engine' },
      { id: 'sk_06', category: 'Frontend', name: 'TypeScript', proficiency: 'Advanced', experienceYears: 4, lastUsed: 'Oct 2026' },
      { id: 'sk_07', category: 'Backend', name: 'Node.js', proficiency: 'Advanced', experienceYears: 5, lastUsed: 'Oct 2026' },
      { id: 'sk_08', category: 'Database', name: 'PostgreSQL', proficiency: 'Intermediate', experienceYears: 3, lastUsed: 'Sep 2026' },
    ],
    domainExpertise: [
      { id: 'de_03', domain: 'Insurance', experienceYears: 6, proficiency: 'Advanced', lastUsed: 'Oct 2026', lastProject: 'Claims Processing Engine', specialization: 'Claims Settlement & Adjudication' },
    ],
    immediateTechnologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    learningTechnologies: ['GraphQL', 'Next.js'],
    profileCompletion: 90,
    status: 'Complete',
    updatedAt: '19 Oct 2026, 10:15',
  },
  {
    id: '105514',
    name: 'Karthik Sundaram',
    email: 'karthik.s@valuemomentum.com',
    designation: 'Senior Software Engineer',
    businessUnit: 'DXG',
    reportingManager: 'Meenakshi Iyer',
    reportingManagerEmail: 'meenakshi.i@valuemomentum.com',
    currentProject: 'Digital Underwriting Platform',
    currentCustomer: 'Travelers',
    location: 'Hyderabad',
    totalExperience: 6,
    currentRole: 'Full Stack Developer',
    owlSureDesignation: 'Senior Software Engineer',
    deployableRoles: ['Full Stack Developer', 'API Developer'],
    technicalSkills: [
      { id: 'sk_09', category: 'Frontend', name: 'React', proficiency: 'Advanced', experienceYears: 4, lastUsed: 'Oct 2026', lastProject: 'Digital Underwriting Platform' },
      { id: 'sk_10', category: 'Backend', name: 'Python', proficiency: 'Advanced', experienceYears: 5, lastUsed: 'Oct 2026' },
      { id: 'sk_11', category: 'Cloud', name: 'Azure', proficiency: 'Intermediate', experienceYears: 2, lastUsed: 'Sep 2026' },
      { id: 'sk_12', category: 'Data', name: 'Pandas', proficiency: 'Intermediate', experienceYears: 3, lastUsed: 'Aug 2026' },
    ],
    domainExpertise: [
      { id: 'de_04', domain: 'Insurance', experienceYears: 4, proficiency: 'Intermediate', lastUsed: 'Oct 2026', lastProject: 'Digital Underwriting Platform', specialization: 'Underwriting Risk Assessment' },
    ],
    immediateTechnologies: ['React', 'Python', 'Azure', 'Django'],
    learningTechnologies: ['Machine Learning', 'Docker'],
    profileCompletion: 85,
    status: 'Complete',
    updatedAt: '18 Oct 2026, 16:30',
  },
  {
    id: '105515',
    name: 'Deepa Lakshmi',
    email: 'deepa.l@valuemomentum.com',
    designation: 'Associate Software Engineer',
    businessUnit: 'CCM',
    reportingManager: 'Saravanan R',
    reportingManagerEmail: 'saravanan.r@valuemomentum.com',
    currentProject: 'Policy Administration Suite',
    currentCustomer: 'Liberty Mutual',
    location: 'Coimbatore',
    totalExperience: 2,
    currentRole: 'Junior Developer',
    owlSureDesignation: 'Associate Software Engineer',
    deployableRoles: ['Junior Developer', 'QA Analyst'],
    technicalSkills: [
      { id: 'sk_13', category: 'Frontend', name: 'HTML/CSS', proficiency: 'Intermediate', experienceYears: 2, lastUsed: 'Oct 2026' },
      { id: 'sk_14', category: 'Frontend', name: 'JavaScript', proficiency: 'Intermediate', experienceYears: 2, lastUsed: 'Oct 2026' },
      { id: 'sk_15', category: 'Backend', name: 'Java', proficiency: 'Beginner', experienceYears: 1, lastUsed: 'Sep 2026' },
    ],
    domainExpertise: [
      { id: 'de_05', domain: 'Insurance', experienceYears: 1.5, proficiency: 'Beginner', lastUsed: 'Oct 2026', lastProject: 'Policy Administration Suite', specialization: 'Policy Issuance' },
    ],
    immediateTechnologies: ['HTML/CSS', 'JavaScript', 'Java'],
    learningTechnologies: ['React', 'Spring Boot'],
    profileCompletion: 72,
    status: 'In Progress',
    updatedAt: '17 Oct 2026, 14:20',
  },
  {
    id: '105516',
    name: 'Arun Prasad',
    email: 'arun.p@valuemomentum.com',
    designation: 'Technical Architect',
    businessUnit: 'DXG',
    reportingManager: 'Meenakshi Iyer',
    reportingManagerEmail: 'meenakshi.i@valuemomentum.com',
    currentProject: 'Billing Modernization',
    currentCustomer: 'Zurich Insurance',
    location: 'Hyderabad',
    totalExperience: 12,
    currentRole: 'Solution Architect',
    owlSureDesignation: 'Technical Architect',
    deployableRoles: ['Solution Architect', 'Technical Lead', 'DevOps Lead'],
    technicalSkills: [
      { id: 'sk_16', category: 'Backend', name: 'Java', proficiency: 'Expert', experienceYears: 11, lastUsed: 'Oct 2026' },
      { id: 'sk_17', category: 'Backend', name: '.NET', proficiency: 'Advanced', experienceYears: 6, lastUsed: 'Jul 2026' },
      { id: 'sk_18', category: 'Cloud', name: 'AWS', proficiency: 'Expert', experienceYears: 7, lastUsed: 'Oct 2026' },
      { id: 'sk_19', category: 'DevOps & Tools', name: 'Docker', proficiency: 'Advanced', experienceYears: 5, lastUsed: 'Oct 2026' },
      { id: 'sk_20', category: 'DevOps & Tools', name: 'Kubernetes', proficiency: 'Advanced', experienceYears: 4, lastUsed: 'Oct 2026' },
      { id: 'sk_21', category: 'Database', name: 'MongoDB', proficiency: 'Advanced', experienceYears: 5, lastUsed: 'Sep 2026' },
    ],
    domainExpertise: [
      { id: 'de_06', domain: 'Insurance', experienceYears: 10, proficiency: 'Expert', lastUsed: 'Oct 2026', lastProject: 'Billing Modernization', specialization: 'Premium Billing & Collections' },
      { id: 'de_07', domain: 'Healthcare', experienceYears: 2, proficiency: 'Intermediate', lastUsed: 'Jan 2024', lastProject: 'Claims Portal' },
    ],
    immediateTechnologies: ['Java', 'AWS', 'Docker', 'Kubernetes', 'MongoDB'],
    learningTechnologies: ['Go', 'Istio'],
    profileCompletion: 92,
    status: 'Complete',
    updatedAt: '19 Oct 2026, 09:45',
  },
  {
    id: '105517',
    name: 'Meenakshi Iyer',
    email: 'meenakshi.i@valuemomentum.com',
    designation: 'Director',
    businessUnit: 'DXG',
    reportingManager: 'Rajesh Venkataraman',
    reportingManagerEmail: 'rajesh.v@valuemomentum.com',
    currentProject: 'Digital Transformation Initiative',
    currentCustomer: 'Zurich Insurance',
    location: 'Hyderabad',
    totalExperience: 15,
    currentRole: 'Practice Head',
    owlSureDesignation: 'Director',
    deployableRoles: ['Practice Head', 'Program Director', 'Delivery Manager'],
    technicalSkills: [
      { id: 'sk_22', category: 'Backend', name: '.NET', proficiency: 'Expert', experienceYears: 12, lastUsed: 'Oct 2026' },
      { id: 'sk_23', category: 'Cloud', name: 'Azure', proficiency: 'Expert', experienceYears: 8, lastUsed: 'Oct 2026' },
      { id: 'sk_24', category: 'Frontend', name: 'Angular', proficiency: 'Advanced', experienceYears: 5, lastUsed: 'Jul 2026' },
      { id: 'sk_25', category: 'Database', name: 'SQL Server', proficiency: 'Expert', experienceYears: 10, lastUsed: 'Oct 2026' },
    ],
    domainExpertise: [
      { id: 'de_08', domain: 'Insurance', experienceYears: 12, proficiency: 'Expert', lastUsed: 'Oct 2026', lastProject: 'Digital Transformation Initiative', specialization: 'Digital Distribution & Portals' },
      { id: 'de_09', domain: 'Banking', experienceYears: 3, proficiency: 'Intermediate', lastUsed: 'Feb 2023', lastProject: 'Net Banking Platform' },
    ],
    immediateTechnologies: ['.NET', 'Azure', 'Angular', 'SQL Server'],
    learningTechnologies: ['AI/ML', 'GenAI'],
    profileCompletion: 88,
    status: 'Complete',
    updatedAt: '19 Oct 2026, 08:30',
  },
  {
    id: '105518',
    name: 'Vikram Bose',
    email: 'vikram.b@valuemomentum.com',
    designation: 'Software Engineer',
    businessUnit: 'QE',
    reportingManager: 'Saravanan R',
    reportingManagerEmail: 'saravanan.r@valuemomentum.com',
    currentProject: 'Automated Testing Framework',
    currentCustomer: 'Nationwide',
    location: 'Chennai',
    totalExperience: 4,
    currentRole: 'QA Engineer',
    owlSureDesignation: 'Software Engineer',
    deployableRoles: ['QA Engineer', 'SDET', 'Automation Tester'],
    technicalSkills: [
      { id: 'sk_26', category: 'Backend', name: 'Java', proficiency: 'Intermediate', experienceYears: 3, lastUsed: 'Oct 2026' },
      { id: 'sk_27', category: 'DevOps & Tools', name: 'Selenium', proficiency: 'Advanced', experienceYears: 4, lastUsed: 'Oct 2026' },
      { id: 'sk_28', category: 'DevOps & Tools', name: 'Jenkins', proficiency: 'Intermediate', experienceYears: 2, lastUsed: 'Sep 2026' },
    ],
    domainExpertise: [
      { id: 'de_10', domain: 'Insurance', experienceYears: 3, proficiency: 'Intermediate', lastUsed: 'Oct 2026', lastProject: 'Automated Testing Framework', specialization: 'Claims Testing & Validation' },
    ],
    immediateTechnologies: ['Java', 'Selenium', 'Jenkins', 'TestNG'],
    learningTechnologies: ['Cypress', 'Playwright'],
    profileCompletion: 78,
    status: 'In Progress',
    updatedAt: '18 Oct 2026, 11:00',
  },
  {
    id: '105519',
    name: 'Ananya Sharma',
    email: 'ananya.s@valuemomentum.com',
    designation: 'Senior Software Engineer',
    businessUnit: 'Data Engineering',
    reportingManager: 'Suresh Kumar',
    reportingManagerEmail: 'suresh.kumar@valuemomentum.com',
    currentProject: 'Data Lake Migration',
    currentCustomer: 'Travelers',
    location: 'Chennai',
    totalExperience: 5,
    currentRole: 'Data Engineer',
    owlSureDesignation: 'Senior Software Engineer',
    deployableRoles: ['Data Engineer', 'ETL Developer', 'BI Developer'],
    technicalSkills: [
      { id: 'sk_29', category: 'Backend', name: 'Python', proficiency: 'Advanced', experienceYears: 4, lastUsed: 'Oct 2026' },
      { id: 'sk_30', category: 'Data', name: 'Apache Spark', proficiency: 'Advanced', experienceYears: 3, lastUsed: 'Oct 2026' },
      { id: 'sk_31', category: 'Cloud', name: 'AWS', proficiency: 'Intermediate', experienceYears: 2, lastUsed: 'Oct 2026' },
      { id: 'sk_32', category: 'Database', name: 'PostgreSQL', proficiency: 'Advanced', experienceYears: 4, lastUsed: 'Oct 2026' },
    ],
    domainExpertise: [
      { id: 'de_11', domain: 'Data Engineering', experienceYears: 4, proficiency: 'Advanced', lastUsed: 'Oct 2026', lastProject: 'Data Lake Migration', specialization: 'Data Pipeline Orchestration' },
    ],
    immediateTechnologies: ['Python', 'Apache Spark', 'AWS Glue', 'PostgreSQL'],
    learningTechnologies: ['Databricks', 'dbt'],
    profileCompletion: 82,
    status: 'In Progress',
    updatedAt: '18 Oct 2026, 15:45',
  },
  {
    id: '105520',
    name: 'Rajesh Venkataraman',
    email: 'rajesh.v@valuemomentum.com',
    designation: 'Vice President',
    businessUnit: 'CCM',
    reportingManager: '',
    reportingManagerEmail: '',
    currentProject: 'Enterprise Strategy',
    currentCustomer: 'Multiple',
    location: 'Hyderabad',
    totalExperience: 22,
    currentRole: 'VP Engineering',
    owlSureDesignation: 'Vice President',
    deployableRoles: ['VP Engineering', 'CTO Advisory', 'Executive Sponsor'],
    technicalSkills: [
      { id: 'sk_33', category: 'Cloud', name: 'AWS', proficiency: 'Expert', experienceYears: 10, lastUsed: 'Oct 2026' },
      { id: 'sk_34', category: 'Backend', name: 'Java', proficiency: 'Expert', experienceYears: 18, lastUsed: 'Jun 2026' },
      { id: 'sk_35', category: 'DevOps & Tools', name: 'Terraform', proficiency: 'Advanced', experienceYears: 4, lastUsed: 'Sep 2026' },
    ],
    domainExpertise: [
      { id: 'de_12', domain: 'Insurance', experienceYears: 18, proficiency: 'Expert', lastUsed: 'Oct 2026', lastProject: 'Enterprise Strategy', specialization: 'Enterprise Architecture & P&C Strategy' },
      { id: 'de_13', domain: 'Banking', experienceYears: 4, proficiency: 'Advanced', lastUsed: 'Dec 2022' },
    ],
    immediateTechnologies: ['AWS', 'Java', 'Terraform', 'Microservices'],
    learningTechnologies: ['GenAI', 'LLM Ops'],
    profileCompletion: 70,
    status: 'In Progress',
    updatedAt: '16 Oct 2026, 09:00',
  },
  {
    id: '105521',
    name: 'Nithya Ramachandran',
    email: 'nithya.r@valuemomentum.com',
    designation: 'Software Engineer',
    businessUnit: 'DXG',
    reportingManager: 'Karthik Sundaram',
    reportingManagerEmail: 'karthik.s@valuemomentum.com',
    currentProject: 'Digital Underwriting Platform',
    currentCustomer: 'Travelers',
    location: 'Coimbatore',
    totalExperience: 1.5,
    currentRole: 'Frontend Developer',
    owlSureDesignation: 'Associate Software Engineer',
    deployableRoles: ['Frontend Developer'],
    technicalSkills: [
      { id: 'sk_36', category: 'Frontend', name: 'React', proficiency: 'Beginner', experienceYears: 1, lastUsed: 'Oct 2026' },
      { id: 'sk_37', category: 'Frontend', name: 'TypeScript', proficiency: 'Beginner', experienceYears: 1, lastUsed: 'Oct 2026' },
      { id: 'sk_38', category: 'Frontend', name: 'HTML/CSS', proficiency: 'Intermediate', experienceYears: 1.5, lastUsed: 'Oct 2026' },
    ],
    domainExpertise: [],
    immediateTechnologies: ['React', 'TypeScript', 'HTML/CSS'],
    learningTechnologies: ['Node.js', 'PostgreSQL', 'AWS'],
    profileCompletion: 55,
    status: 'Needs Review',
    updatedAt: '15 Oct 2026, 12:30',
  },
];

(async () => {
  let success = 0;
  let failed = 0;
  for (const emp of employees) {
    try {
      const result = await post('/api/employees', emp);
      console.log(`OK  ${emp.id} ${emp.name} (${emp.designation} | ${emp.businessUnit} | ${emp.location})`);
      success++;
    } catch (err) {
      console.error(`FAIL ${emp.id} ${emp.name}: ${err.message}`);
      failed++;
    }
  }
  console.log(`\nDone: ${success} created, ${failed} failed`);
})();
