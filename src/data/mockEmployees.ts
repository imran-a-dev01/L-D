import { Employee } from '../types/employee';
import { employeeService } from '../services/employeeService';

/**
 * Workforce Dataset
 * All hardcoded employees have been removed.
 * Data is dynamically fetched from the SQLite database via /api/employees.
 */
export const INITIAL_EMPLOYEES: Employee[] = new Proxy([] as Employee[], {
  get(_target, prop) {
    const list = employeeService.getAll();
    return Reflect.get(list, prop);
  },
});
