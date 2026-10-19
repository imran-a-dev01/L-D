import { Employee } from '../types/employee';
import { api } from './api';

export interface SaveResult {
  success: boolean;
  employee?: Employee;
  error?: string;
}

export const employeeService = {
  async fetchAllFromBackend(): Promise<Employee[]> {
    const { employees } = await api.getEmployees();
    return employees || [];
  },

  async getById(id: string): Promise<Employee | undefined> {
    try {
      const { employee } = await api.getEmployeeById(id);
      return employee;
    } catch {
      return undefined;
    }
  },

  async save(employee: Employee, isEdit?: boolean): Promise<SaveResult> {
    try {
      let savedEmployee: Employee;
      if (isEdit) {
        const response = await api.updateEmployee(employee.id, employee);
        savedEmployee = response.employee;
      } else {
        const response = await api.createEmployee(employee);
        savedEmployee = response.employee;
      }
      return { success: true, employee: savedEmployee };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save employee to database' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.deleteEmployee(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete employee from database' };
    }
  },

  calculateCompletion(emp: Partial<Employee>): number {
    let score = 0;
    const max = 10;

    if (emp.id && emp.name) score += 2;
    if (emp.email) score += 1;
    if (emp.designation) score += 1;
    if (emp.businessUnit) score += 1;
    if (emp.reportingManager) score += 1;
    if (emp.currentProject) score += 1;
    if (emp.location) score += 1;
    if (emp.deployableRoles && emp.deployableRoles.length > 0) score += 1;
    if (emp.technicalSkills && emp.technicalSkills.length > 0) score += 1;

    return Math.min(100, Math.round((score / max) * 100));
  },

  async getAll(): Promise<Employee[]> {
    return this.fetchAllFromBackend();
  },

  async reset(): Promise<Employee[]> {
    try {
      await api.resetEmployees();
      const { employees } = await api.getEmployees();
      return employees || [];
    } catch (err) {
      console.warn('Could not reset SQLite backend:', err);
      return [];
    }
  },

  async exportXlsx(list: Employee[], customFilename?: string): Promise<void> {
    const ExcelJSModule = await import('exceljs');
    const ExcelJS = (ExcelJSModule as any).default || ExcelJSModule;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXUS L&D';
    workbook.lastModifiedBy = 'NEXUS L&D';
    workbook.created = new Date();
    workbook.modified = new Date();

    const STANDARD_CATEGORIES = ['Frontend', 'Backend', 'Database', 'Cloud', 'Data', 'DevOps & Tools'] as const;

    const sanitizeText = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val).trim();
      if (!str) return '';
      if (['=', '+', '-', '@'].includes(str[0])) {
        return `'${str}`;
      }
      return str;
    };

    const sanitizeNumber = (val: any): number => {
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      return isNaN(num) ? 0 : num;
    };

    const PROFICIENCY_RANK: Record<string, number> = {
      Expert: 1,
      Advanced: 2,
      Intermediate: 3,
      Beginner: 4,
    };

    // Check if any employee has skills in a category not in STANDARD_CATEGORIES
    const hasOtherSkills = list.some((emp) =>
      (emp.technicalSkills || []).some((s) => {
        const cat = s.category?.trim();
        return cat && !STANDARD_CATEGORIES.includes(cat as any);
      })
    );

    // Common styling tokens
    const headerFill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FF1265FF' },
    };
    const headerFont = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    const bodyFont = {
      name: 'Calibri',
      size: 11,
      color: { argb: 'FF0B1B4D' },
    };
    const thinBorder = {
      top: { style: 'thin' as const, color: { argb: 'FFE3EAF5' } },
      left: { style: 'thin' as const, color: { argb: 'FFE3EAF5' } },
      bottom: { style: 'thin' as const, color: { argb: 'FFE3EAF5' } },
      right: { style: 'thin' as const, color: { argb: 'FFE3EAF5' } },
    };
    const evenRowFill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFFFFFFF' },
    };
    const oddRowFill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFF8FAFD' },
    };

    // Helper to format category skills (one per line, sorted Expert > Adv > Int > Beg, then name)
    const formatCategorySkills = (skills: typeof list[0]['technicalSkills'], targetCategory: string, isOther = false) => {
      const filtered = (skills || []).filter((s) => {
        const cat = s.category?.trim() || '';
        if (isOther) {
          return cat && !STANDARD_CATEGORIES.includes(cat as any);
        }
        return cat.toLowerCase() === targetCategory.toLowerCase();
      });

      const sorted = [...filtered].sort((a, b) => {
        const rankA = PROFICIENCY_RANK[a.proficiency?.trim() || ''] ?? 99;
        const rankB = PROFICIENCY_RANK[b.proficiency?.trim() || ''] ?? 99;
        if (rankA !== rankB) return rankA - rankB;
        return (a.name || '').localeCompare(b.name || '');
      });

      return sorted
        .map((s) => {
          const name = s.name?.trim() || '';
          const parts: string[] = [];
          if (s.proficiency?.trim()) parts.push(s.proficiency.trim());
          if (s.experienceYears) parts.push(`${s.experienceYears}y`);
          const meta = parts.join(', ');
          const line = meta ? `${name} (${meta})` : name;
          return sanitizeText(line);
        })
        .filter(Boolean)
        .join('\n');
    };

    // Helper to format deployable roles (one per line)
    const formatDeployableRoles = (roles: string[]) => {
      return (roles || [])
        .map((r) => sanitizeText(r))
        .filter(Boolean)
        .join('\n');
    };

    // Helper to format domain depth (one per line: "Domain (Proficiency, Ny)")
    const formatDomains = (domains: typeof list[0]['domainExpertise']) => {
      return (domains || [])
        .map((d) => {
          const domainName = (d.domain === 'Others' ? d.customDomain : d.domain)?.trim() || '';
          if (!domainName) return '';
          const parts: string[] = [];
          if (d.proficiency?.trim()) parts.push(d.proficiency.trim());
          if (d.experienceYears) parts.push(`${d.experienceYears}y`);
          const meta = parts.join(', ');
          const text = meta ? `${domainName} (${meta})` : domainName;
          return sanitizeText(text);
        })
        .filter(Boolean)
        .join('\n');
    };

    // ==========================================
    // SHEET 1: Employees
    // ==========================================
    const sheet1 = workbook.addWorksheet('Employees', {
      properties: { tabColor: { argb: 'FF1265FF' } },
      views: [{ state: 'frozen', xSplit: 2, ySplit: 1, activeCell: 'C2' }],
    });

    const sheet1Columns = [
      { header: 'Employee ID', key: 'id', width: 15 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Designation', key: 'designation', width: 24 },
      { header: 'Business Unit', key: 'businessUnit', width: 22 },
      { header: 'Reporting Manager', key: 'reportingManager', width: 24 },
      { header: 'Reporting Manager Email', key: 'reportingManagerEmail', width: 28 },
      { header: 'Current Project', key: 'currentProject', width: 22 },
      { header: 'Current Customer', key: 'currentCustomer', width: 22 },
      { header: 'Location', key: 'location', width: 16 },
      { header: 'Total Experience', key: 'totalExperience', width: 18 },
      { header: 'Current Role', key: 'currentRole', width: 22 },
      { header: 'OwlSure Designation', key: 'owlSureDesignation', width: 24 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Profile Completion', key: 'profileCompletion', width: 18 },
      { header: 'Deployable Roles', key: 'deployableRoles', width: 28 },
      { header: 'Total Skills', key: 'totalSkills', width: 14 },
      { header: 'Frontend', key: 'cat_frontend', width: 32 },
      { header: 'Backend', key: 'cat_backend', width: 32 },
      { header: 'Database', key: 'cat_database', width: 32 },
      { header: 'Cloud', key: 'cat_cloud', width: 32 },
      { header: 'Data', key: 'cat_data', width: 32 },
      { header: 'DevOps & Tools', key: 'cat_devops', width: 32 },
    ];

    if (hasOtherSkills) {
      sheet1Columns.push({ header: 'Other Skills', key: 'cat_other', width: 32 });
    }

    sheet1Columns.push(
      { header: 'Domain Expertise', key: 'domainExpertise', width: 34 },
      { header: 'Updated At', key: 'updatedAt', width: 20 }
    );

    sheet1.columns = sheet1Columns;

    // Populate Sheet 1 rows
    list.forEach((emp) => {
      const rowData: Record<string, any> = {
        id: sanitizeText(emp.id),
        name: sanitizeText(emp.name),
        email: sanitizeText(emp.email),
        designation: sanitizeText(emp.designation),
        businessUnit: sanitizeText(emp.businessUnit),
        reportingManager: sanitizeText(emp.reportingManager),
        reportingManagerEmail: sanitizeText(emp.reportingManagerEmail || ''),
        currentProject: sanitizeText(emp.currentProject),
        currentCustomer: sanitizeText(emp.currentCustomer),
        location: sanitizeText(emp.location),
        totalExperience: sanitizeNumber(emp.totalExperience),
        currentRole: sanitizeText(emp.currentRole),
        owlSureDesignation: sanitizeText(emp.owlSureDesignation),
        status: sanitizeText(emp.status),
        profileCompletion: sanitizeNumber(emp.profileCompletion) / 100,
        deployableRoles: formatDeployableRoles(emp.deployableRoles || []),
        totalSkills: (emp.technicalSkills || []).length,
        cat_frontend: formatCategorySkills(emp.technicalSkills, 'Frontend'),
        cat_backend: formatCategorySkills(emp.technicalSkills, 'Backend'),
        cat_database: formatCategorySkills(emp.technicalSkills, 'Database'),
        cat_cloud: formatCategorySkills(emp.technicalSkills, 'Cloud'),
        cat_data: formatCategorySkills(emp.technicalSkills, 'Data'),
        cat_devops: formatCategorySkills(emp.technicalSkills, 'DevOps & Tools'),
        domainExpertise: formatDomains(emp.domainExpertise),
        updatedAt: sanitizeText(emp.updatedAt),
      };

      if (hasOtherSkills) {
        rowData.cat_other = formatCategorySkills(emp.technicalSkills, '', true);
      }

      sheet1.addRow(rowData);
    });

    // Style Sheet 1
    const totalColsSheet1 = sheet1Columns.length;
    sheet1.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: totalColsSheet1 },
    };

    const headerRowSheet1 = sheet1.getRow(1);
    headerRowSheet1.height = 28;
    headerRowSheet1.eachCell((cell: any) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });

    sheet1.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return;
      const fill = rowNumber % 2 === 0 ? evenRowFill : oddRowFill;
      row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
        cell.font = bodyFont;
        cell.border = thinBorder;
        cell.fill = fill;

        const colKey = sheet1Columns[colNumber - 1]?.key;
        if (
          colKey === 'deployableRoles' ||
          colKey === 'domainExpertise' ||
          (colKey && colKey.startsWith('cat_'))
        ) {
          cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        } else if (colKey === 'totalExperience') {
          cell.numFmt = '0.0';
          cell.alignment = { vertical: 'top', horizontal: 'right' };
        } else if (colKey === 'totalSkills') {
          cell.numFmt = '0';
          cell.alignment = { vertical: 'top', horizontal: 'right' };
        } else if (colKey === 'profileCompletion') {
          cell.numFmt = '0%';
          cell.alignment = { vertical: 'top', horizontal: 'right' };
        } else if (colKey === 'id' || colKey === 'status') {
          cell.alignment = { vertical: 'top', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'top', horizontal: 'left' };
        }
      });
    });

    // ==========================================
    // SHEET 2: Skills
    // ==========================================
    const sheet2 = workbook.addWorksheet('Skills', {
      properties: { tabColor: { argb: 'FF2563EB' } },
      views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
    });

    const sheet2Columns = [
      { header: 'Employee ID', key: 'id', width: 15 },
      { header: 'Employee Name', key: 'name', width: 24 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Skill', key: 'skill', width: 24 },
      { header: 'Proficiency', key: 'proficiency', width: 16 },
      { header: 'Experience (Years)', key: 'experienceYears', width: 20 },
      { header: 'Last Used', key: 'lastUsed', width: 16 },
      { header: 'Last Project', key: 'lastProject', width: 24 },
      { header: 'Specialization', key: 'specialization', width: 24 },
    ];
    sheet2.columns = sheet2Columns;

    list.forEach((emp) => {
      (emp.technicalSkills || []).forEach((s) => {
        sheet2.addRow({
          id: sanitizeText(emp.id),
          name: sanitizeText(emp.name),
          category: sanitizeText(s.category),
          skill: sanitizeText(s.name),
          proficiency: sanitizeText(s.proficiency),
          experienceYears: sanitizeNumber(s.experienceYears),
          lastUsed: sanitizeText(s.lastUsed),
          lastProject: sanitizeText(s.lastProject),
          specialization: sanitizeText(s.specialization),
        });
      });
    });

    sheet2.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet2Columns.length },
    };

    const headerRowSheet2 = sheet2.getRow(1);
    headerRowSheet2.height = 28;
    headerRowSheet2.eachCell((cell: any) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });

    sheet2.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return;
      const fill = rowNumber % 2 === 0 ? evenRowFill : oddRowFill;
      row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
        cell.font = bodyFont;
        cell.border = thinBorder;
        cell.fill = fill;

        const colKey = sheet2Columns[colNumber - 1]?.key;
        if (colKey === 'experienceYears') {
          cell.numFmt = '0.0';
          cell.alignment = { vertical: 'top', horizontal: 'right' };
        } else if (colKey === 'id' || colKey === 'proficiency') {
          cell.alignment = { vertical: 'top', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'top', horizontal: 'left' };
        }
      });
    });

    // ==========================================
    // SHEET 3: Domains
    // ==========================================
    const sheet3 = workbook.addWorksheet('Domains', {
      properties: { tabColor: { argb: 'FF4F46E5' } },
      views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
    });

    const sheet3Columns = [
      { header: 'Employee ID', key: 'id', width: 15 },
      { header: 'Employee Name', key: 'name', width: 24 },
      { header: 'Domain', key: 'domain', width: 26 },
      { header: 'Proficiency', key: 'proficiency', width: 16 },
      { header: 'Experience (Years)', key: 'experienceYears', width: 20 },
      { header: 'Last Used', key: 'lastUsed', width: 16 },
      { header: 'Last Project', key: 'lastProject', width: 24 },
      { header: 'Specialization', key: 'specialization', width: 24 },
    ];
    sheet3.columns = sheet3Columns;

    list.forEach((emp) => {
      (emp.domainExpertise || []).forEach((d) => {
        const domainName = (d.domain === 'Others' ? d.customDomain : d.domain) || '';
        sheet3.addRow({
          id: sanitizeText(emp.id),
          name: sanitizeText(emp.name),
          domain: sanitizeText(domainName),
          proficiency: sanitizeText(d.proficiency),
          experienceYears: sanitizeNumber(d.experienceYears),
          lastUsed: sanitizeText(d.lastUsed),
          lastProject: sanitizeText(d.lastProject),
          specialization: sanitizeText(d.specialization),
        });
      });
    });

    sheet3.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet3Columns.length },
    };

    const headerRowSheet3 = sheet3.getRow(1);
    headerRowSheet3.height = 28;
    headerRowSheet3.eachCell((cell: any) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });

    sheet3.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return;
      const fill = rowNumber % 2 === 0 ? evenRowFill : oddRowFill;
      row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
        cell.font = bodyFont;
        cell.border = thinBorder;
        cell.fill = fill;

        const colKey = sheet3Columns[colNumber - 1]?.key;
        if (colKey === 'experienceYears') {
          cell.numFmt = '0.0';
          cell.alignment = { vertical: 'top', horizontal: 'right' };
        } else if (colKey === 'id' || colKey === 'proficiency') {
          cell.alignment = { vertical: 'top', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'top', horizontal: 'left' };
        }
      });
    });

    workbook.views = [{ activeTab: 0 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = customFilename || `nexus_workforce_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportCsv(list: Employee[], customFilename?: string) {
    const headers = [
      'Employee ID',
      'Name',
      'Designation',
      'Business Unit',
      'Reporting Manager',
      'Reporting Manager Email',
      'Location',
      'Category',
      'Skill',
      'Proficiency',
      'Experience (Years)',
      'Last Used',
      'Last Project',
      'Specialization',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).trim();
      if (['=', '+', '-', '@'].includes(str[0])) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows: (string | number)[][] = [];

    list.forEach((emp) => {
      const skills = emp.technicalSkills || [];
      if (skills.length === 0) {
        rows.push([
          escapeCsv(emp.id),
          escapeCsv(emp.name),
          escapeCsv(emp.designation),
          escapeCsv(emp.businessUnit),
          escapeCsv(emp.reportingManager || ''),
          escapeCsv(emp.reportingManagerEmail || ''),
          escapeCsv(emp.location),
          '""',
          '""',
          '""',
          0,
          '""',
          '""',
          '""',
        ]);
      } else {
        skills.forEach((s) => {
          const expYears = typeof s.experienceYears === 'number' ? s.experienceYears : (parseFloat(String(s.experienceYears)) || 0);
          rows.push([
            escapeCsv(emp.id),
            escapeCsv(emp.name),
            escapeCsv(emp.designation),
            escapeCsv(emp.businessUnit),
            escapeCsv(emp.reportingManager || ''),
            escapeCsv(emp.reportingManagerEmail || ''),
            escapeCsv(emp.location),
            escapeCsv(s.category),
            escapeCsv(s.name),
            escapeCsv(s.proficiency),
            expYears,
            escapeCsv(s.lastUsed),
            escapeCsv(s.lastProject),
            escapeCsv(s.specialization),
          ]);
        });
      }
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', customFilename || `nexus_workforce_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportJson(list: Employee[], customFilename?: string) {
    const jsonStr = JSON.stringify(list, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', customFilename || `nexus_workforce_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
