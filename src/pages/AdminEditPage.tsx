import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Employee } from '../types/employee';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';
import { CreateEmployeePage } from './CreateEmployeePage';
import { PageBreadcrumb } from '../components/layout/PageBreadcrumb';

interface AdminEditPageProps {
  employees: Employee[];
  onEmployeeSaved: () => Promise<void>;
}

export const AdminEditPage: React.FC<AdminEditPageProps> = ({
  employees,
  onEmployeeSaved,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(() => {
    if (!id) return null;
    return employees.find((e) => e.id.toLowerCase() === id.toLowerCase()) || null;
  });
  const [isLoading, setIsLoading] = useState(!employee);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const existing = employees.find((e) => e.id.toLowerCase() === id.toLowerCase());
    if (existing) {
      setEmployee(existing);
      setIsLoading(false);
      return;
    }

    // Fetch single employee from backend if not found in memory
    setIsLoading(true);
    api.getEmployeeById(id)
      .then((res) => {
        if (res && res.employee) {
          setEmployee(res.employee);
        } else {
          setLoadError(`Employee with ID "${id}" was not found.`);
        }
      })
      .catch((err) => {
        setLoadError(err.message || `Failed to load employee "${id}".`);
      })
      .finally(() => setIsLoading(false));
  }, [id, employees]);

  const handleSave = async (updatedEmp: Employee) => {
    if (!id) return;
    setIsSaving(true);
    try {
      await api.updateEmployee(id, updatedEmp);
      await onEmployeeSaved();
      toast(`Profile for "${updatedEmp.name}" (${updatedEmp.id}) updated successfully!`, 'success', 'Profile Updated');
      navigate('/admin/employees');
    } catch (err: any) {
      toast(err.message || 'Failed to update employee profile', 'error', 'Save Failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-[#1265FF] rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#64748B]">Loading employee profile for editing...</p>
      </div>
    );
  }

  if (loadError || !employee) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#0B1B4D]">Employee Not Found</h3>
        <p className="text-xs text-[#64748B]">{loadError || `No record found for ID "${id}".`}</p>
        <button
          type="button"
          onClick={() => navigate('/admin/employees')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1265FF] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-600 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employees</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb label={`Edit ${employee.name}`} />

        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-[#DFE5EE] text-[#0B1B4D] text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#64748B]" />
          <span>Back to dashboard</span>
        </button>
      </div>

      {/* Reused CreateEmployeePage with locked ID and prefilled data */}
      <CreateEmployeePage
        initialEmployee={employee}
        lockId={true}
        onSave={handleSave}
        onCancel={() => navigate('/admin')}
        isSaving={isSaving}
      />
    </div>
  );
};
