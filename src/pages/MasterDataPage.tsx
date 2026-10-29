import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Badge,
  Building2,
  MapPin,
  Users,
  FolderOpen,
  Briefcase,
  UserCheck,
  Rocket,
  Layers,
  Globe,
  Signal,
  ClipboardCheck,
  Code2,
  FileText,
  Loader2,
  RefreshCw,
  Settings2,
  ToggleLeft,
  ToggleRight,
  ListFilter,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { dropdownService } from '../services/dropdownService';
import { useToast } from '../components/common/Toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DropdownItem {
  id: number;
  name: string;
  email?: string;
}

interface SkillItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
}

interface CustomField {
  id: number;
  section: string;
  label: string;
  field_type: string;
  is_required: number;
  sort_order: number;
}

interface CustomOption {
  id: number;
  value: string;
  sort_order: number;
}

type SelectionMode =
  | { kind: 'dropdown'; typeKey: string; label: string; hasEmail?: boolean }
  | { kind: 'skills'; category: string }
  | { kind: 'custom-options'; field: CustomField };

interface NavChild {
  key: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  selection: SelectionMode;
  isSkillDot?: boolean;
  isCustom?: boolean;
}

interface NavSection {
  key: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  children: NavChild[];
  canAddField?: boolean;
}

// ---------------------------------------------------------------------------
// Static children (system dropdowns)
// ---------------------------------------------------------------------------

const EMP_INFO: NavChild[] = [
  { key: 'designation', label: 'Designations', icon: Badge, selection: { kind: 'dropdown', typeKey: 'designation', label: 'Designations' } },
  { key: 'business_unit', label: 'Business Units', icon: Building2, selection: { kind: 'dropdown', typeKey: 'business_unit', label: 'Business Units' } },
  { key: 'location', label: 'Locations', icon: MapPin, selection: { kind: 'dropdown', typeKey: 'location', label: 'Locations' } },
  { key: 'manager', label: 'Reporting Managers', icon: Users, selection: { kind: 'dropdown', typeKey: 'manager', label: 'Reporting Managers', hasEmail: true } },
  { key: 'project', label: 'Projects', icon: FolderOpen, selection: { kind: 'dropdown', typeKey: 'project', label: 'Projects' } },
  { key: 'customer', label: 'Customers', icon: Briefcase, selection: { kind: 'dropdown', typeKey: 'customer', label: 'Customers' } },
  { key: 'current_role', label: 'Current Roles', icon: UserCheck, selection: { kind: 'dropdown', typeKey: 'current_role', label: 'Current Roles' } },
  { key: 'deployable_role', label: 'Deployable Roles', icon: Rocket, selection: { kind: 'dropdown', typeKey: 'deployable_role', label: 'Deployable Roles' } },
];

const DOMAIN_CHILDREN: NavChild[] = [
  { key: 'domain', label: 'Domains', icon: Globe, selection: { kind: 'dropdown', typeKey: 'domain', label: 'Domains' } },
  { key: 'domain_proficiency', label: 'Proficiency Levels', icon: Signal, selection: { kind: 'dropdown', typeKey: 'proficiency_level', label: 'Proficiency Levels' } },
];

interface CustomSection {
  id: number;
  label: string;
  after_key: string;
}

// System section keys → DB section values
const SYSTEM_SECTIONS = [
  { key: 'employee-info', dbKey: 'employee_info', label: 'Employee Information', icon: FileText },
  { key: 'technical-skills', dbKey: 'technical_skills', label: 'Technical Skills', icon: Code2 },
  { key: 'domain', dbKey: 'domain', label: 'Domain', icon: Globe },
] as const;

function sectionKeyToDb(key: string): string {
  const sys = SYSTEM_SECTIONS.find((s) => s.key === key);
  if (sys) return sys.dbKey;
  if (key.startsWith('custom_section_')) return key;
  return key;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MasterDataPage() {
  const { toast } = useToast();

  // ── Section expand/collapse ───────────────────────────────────────────
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'employee-info': true,
    'technical-skills': true,
    domain: true,
    review: true,
  });
  const toggleSection = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Skill categories from DB ──────────────────────────────────────────
  const [skillCategories, setSkillCategories] = useState<DropdownItem[]>([]);
  const fetchSkillCategories = useCallback(async () => {
    try {
      const res = await api.getDropdownsByType('skill_category');
      setSkillCategories(res.items);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchSkillCategories(); }, [fetchSkillCategories]);

  // ── Custom sections from DB ───────────────────────────────────────────
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const fetchCustomSections = useCallback(async () => {
    try {
      const res = await api.getCustomSections();
      setCustomSections(res.sections);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchCustomSections(); }, [fetchCustomSections]);

  // ── Custom fields from DB ─────────────────────────────────────────────
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const fetchCustomFields = useCallback(async () => {
    try {
      const res = await api.getCustomFields();
      setCustomFields(res.fields);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchCustomFields(); }, [fetchCustomFields]);

  // ── Overrides from DB (rename/hide system items) ─────────────────────
  const [overrides, setOverrides] = useState<Record<string, { label: string | null; hidden: boolean }>>({});
  const fetchOverrides = useCallback(async () => {
    try {
      const res = await api.getOverrides();
      setOverrides(res.overrides);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchOverrides(); }, [fetchOverrides]);

  // ── Build full nav sections ───────────────────────────────────────────
  const sections = useMemo<NavSection[]>(() => {
    const techChildren: NavChild[] = [
      {
        key: 'proficiency_level',
        label: 'Proficiency Levels',
        icon: Signal,
        selection: { kind: 'dropdown', typeKey: 'proficiency_level', label: 'Proficiency Levels' },
      },
      {
        key: 'skill_category',
        label: 'Skill Categories',
        icon: Layers,
        selection: { kind: 'dropdown', typeKey: 'skill_category', label: 'Skill Categories' },
      },
      ...skillCategories
        .filter((c) => c.name !== 'Domain Expertise')
        .map((cat): NavChild => ({
          key: `skills:${cat.name}`,
          label: cat.name,
          icon: Code2,
          selection: { kind: 'skills', category: cat.name },
          isSkillDot: true,
        })),
    ];

    const withCustomFields = (dbSectionKey: string, systemChildren: NavChild[]): NavChild[] => {
      const customs = customFields
        .filter((f) => f.section === dbSectionKey)
        .map((f): NavChild => ({
          key: `custom:${f.id}`,
          label: f.label,
          icon: Settings2,
          selection: { kind: 'custom-options', field: f },
          isCustom: true,
        }));
      return [...systemChildren, ...customs];
    };

    const applyFieldOverrides = (children: NavChild[]): NavChild[] =>
      children
        .filter((c) => {
          if (c.isCustom || c.isSkillDot) return true;
          return !overrides[`field:${c.key}`]?.hidden;
        })
        .map((c) => {
          if (c.isCustom || c.isSkillDot) return c;
          const ov = overrides[`field:${c.key}`];
          return ov?.label ? { ...c, label: ov.label } : c;
        });

    const rawSysSections = [
      { key: 'employee-info', defaultLabel: 'Employee Information', icon: FileText, dbKey: 'employee_info', sysChildren: EMP_INFO },
      { key: 'technical-skills', defaultLabel: 'Technical Skills', icon: Code2, dbKey: 'technical_skills', sysChildren: techChildren },
      { key: 'domain', defaultLabel: 'Domain', icon: Globe, dbKey: 'domain', sysChildren: DOMAIN_CHILDREN },
    ];

    const systemSections: NavSection[] = rawSysSections
      .filter((s) => !overrides[`section:${s.key}`]?.hidden)
      .map((s): NavSection => ({
        key: s.key,
        label: overrides[`section:${s.key}`]?.label || s.defaultLabel,
        icon: s.icon,
        children: applyFieldOverrides(withCustomFields(s.dbKey, s.sysChildren)),
        canAddField: s.key !== 'technical-skills',
      }));

    // Interleave custom sections after their `after_key` reference
    const result: NavSection[] = [];
    const customByAfter = new Map<string, CustomSection[]>();
    for (const cs of customSections) {
      const arr = customByAfter.get(cs.after_key) || [];
      arr.push(cs);
      customByAfter.set(cs.after_key, arr);
    }

    const insertCustomAfter = (afterKey: string) => {
      const customs = customByAfter.get(afterKey) || [];
      for (const cs of customs) {
        const sectionDbKey = `custom_section_${cs.id}`;
        const children = withCustomFields(sectionDbKey, []);
        result.push({
          key: `custom_section_${cs.id}`,
          label: cs.label,
          icon: FolderOpen,
          children,
          canAddField: true,
        });
        insertCustomAfter(`custom_section_${cs.id}`);
      }
    };

    for (const sys of systemSections) {
      result.push(sys);
      insertCustomAfter(sys.key);
    }

    return result;
  }, [skillCategories, customFields, customSections, overrides]);

  // ── Active selection ──────────────────────────────────────────────────
  const [activeKey, setActiveKey] = useState('designation');

  const activeChild = useMemo<NavChild | undefined>(() => {
    for (const sec of sections) {
      const found = sec.children.find((c) => c.key === activeKey);
      if (found) return found;
    }
    return undefined;
  }, [activeKey, sections]);

  const sel = activeChild?.selection;

  const activeSection = useMemo<NavSection | undefined>(() => {
    for (const sec of sections) {
      if (sec.key === activeKey || sec.children.some((c) => c.key === activeKey)) return sec;
    }
    return undefined;
  }, [activeKey, sections]);

  const isActiveInCustomSection = activeSection?.key.startsWith('custom_section_') ?? false;

  // Derived mode helpers
  const isDropdownMode = sel?.kind === 'dropdown';
  const isSkillsMode = sel?.kind === 'skills';
  const isCustomMode = sel?.kind === 'custom-options';
  const isTextFieldMode = isCustomMode && sel?.kind === 'custom-options' && sel.field.field_type === 'text';
  const hasEmailColumn = isDropdownMode && sel.hasEmail === true;

  const panelLabel = useMemo(() => {
    if (!sel) return '';
    if (sel.kind === 'dropdown') return sel.label;
    if (sel.kind === 'skills') return `${sel.category} — Skills`;
    if (sel.kind === 'custom-options') return sel.field.label;
    return '';
  }, [sel]);

  // ── Data fetching ─────────────────────────────────────────────────────
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const [allSkills, setAllSkills] = useState<SkillItem[]>([]);
  const [customOptions, setCustomOptions] = useState<CustomOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!sel) return;
    setIsLoading(true);
    try {
      if (sel.kind === 'dropdown') {
        const res = await api.getDropdownsByType(sel.typeKey);
        setDropdownItems(res.items);
      } else if (sel.kind === 'skills') {
        const res = await api.getSkills();
        setAllSkills(res.skills as unknown as SkillItem[]);
      } else if (sel.kind === 'custom-options') {
        const res = await api.getCustomFieldOptions(sel.field.id);
        setCustomOptions(res.options);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load', 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [sel, toast]);

  useEffect(() => {
    setSearchQuery('');
    setEditingId(null);
    setDeleteConfirm(null);
    setNewValue('');
    setNewEmail('');
    fetchData();
  }, [activeKey, fetchData]);

  // Items for table display
  const rawItems: any[] = useMemo(() => {
    if (isDropdownMode) return dropdownItems;
    if (isSkillsMode && sel) {
      return allSkills.filter(
        (s) => s.category.toLowerCase() === sel.category.toLowerCase(),
      );
    }
    if (isCustomMode) return customOptions.map((o) => ({ id: o.id, name: o.value }));
    return [];
  }, [isDropdownMode, isSkillsMode, isCustomMode, sel, dropdownItems, allSkills, customOptions]);

  const [searchQuery, setSearchQuery] = useState('');
  const displayItems = useMemo(() => {
    if (!searchQuery.trim()) return rawItems;
    const q = searchQuery.toLowerCase();
    return rawItems.filter(
      (item: any) =>
        (item.name ?? item.value ?? '').toLowerCase().includes(q) ||
        (item.email ?? '').toLowerCase().includes(q),
    );
  }, [rawItems, searchQuery]);

  // ── Add item ──────────────────────────────────────────────────────────
  const [newValue, setNewValue] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    const trimmed = newValue.trim();
    if (!trimmed || !sel) return;
    setIsAdding(true);
    try {
      if (sel.kind === 'dropdown') {
        if (sel.typeKey === 'manager') {
          await dropdownService.addOption('manager', trimmed, newEmail.trim() || undefined);
        } else {
          await dropdownService.addOption(sel.typeKey, trimmed);
        }
        toast(`"${trimmed}" added`, 'success', 'Added');
        const res = await api.getDropdownsByType(sel.typeKey);
        setDropdownItems(res.items);
        if (sel.typeKey === 'skill_category') await fetchSkillCategories();
      } else if (sel.kind === 'skills') {
        await api.createSkill({ name: trimmed, category: sel.category });
        toast(`"${trimmed}" added to ${sel.category}`, 'success', 'Skill Added');
        const res = await api.getSkills();
        setAllSkills(res.skills as unknown as SkillItem[]);
      } else if (sel.kind === 'custom-options') {
        await api.addCustomFieldOption(sel.field.id, trimmed);
        toast(`"${trimmed}" added`, 'success', 'Added');
        const res = await api.getCustomFieldOptions(sel.field.id);
        setCustomOptions(res.options);
      }
      setNewValue('');
      setNewEmail('');
    } catch (err: any) {
      toast(err.message || 'Failed to add', 'error', 'Error');
    } finally {
      setIsAdding(false);
    }
  };

  // ── Edit item ─────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditValue(item.name ?? item.value ?? '');
    setEditEmail(item.email ?? '');
  };
  const handleCancelEdit = () => { setEditingId(null); };

  const handleSaveEdit = async () => {
    if (editingId == null || !editValue.trim() || !sel) return;
    setIsSaving(true);
    try {
      if (sel.kind === 'dropdown') {
        await dropdownService.updateOption(
          sel.typeKey,
          editingId as number,
          editValue.trim(),
          sel.typeKey === 'manager' ? editEmail.trim() : undefined,
        );
        const res = await api.getDropdownsByType(sel.typeKey);
        setDropdownItems(res.items);
        if (sel.typeKey === 'skill_category') await fetchSkillCategories();
      } else if (sel.kind === 'skills') {
        await api.updateSkill(String(editingId), { name: editValue.trim() });
        const res = await api.getSkills();
        setAllSkills(res.skills as unknown as SkillItem[]);
      } else if (sel.kind === 'custom-options') {
        await api.updateCustomFieldOption(sel.field.id, editingId as number, editValue.trim());
        const res = await api.getCustomFieldOptions(sel.field.id);
        setCustomOptions(res.options);
      }
      toast('Updated', 'success', 'Updated');
      setEditingId(null);
    } catch (err: any) {
      toast(err.message || 'Failed to update', 'error', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete item ───────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number | string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    if (!deleteConfirm || !sel) {
      setUsageCount(null);
      setUsageLoading(false);
      return;
    }
    setUsageLoading(true);
    setUsageCount(null);
    setDeleteError(null);

    if (sel.kind === 'dropdown') {
      api.getDropdownUsage(sel.typeKey, deleteConfirm.id as number)
        .then((res) => setUsageCount(res.usageCount))
        .catch(() => setUsageCount(null))
        .finally(() => setUsageLoading(false));
    } else if (sel.kind === 'skills') {
      api.getSkillUsage(String(deleteConfirm.id))
        .then((res) => setUsageCount(res.usageCount))
        .catch(() => setUsageCount(null))
        .finally(() => setUsageLoading(false));
    } else if (sel.kind === 'custom-options') {
      api.getCustomFieldOptionUsage(sel.field.id, deleteConfirm.id as number)
        .then((res) => setUsageCount(res.usageCount))
        .catch(() => setUsageCount(null))
        .finally(() => setUsageLoading(false));
    } else {
      setUsageLoading(false);
    }
  }, [deleteConfirm, sel]);

  const handleDelete = async () => {
    if (!deleteConfirm || !sel) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (sel.kind === 'dropdown') {
        await dropdownService.deleteOption(sel.typeKey, deleteConfirm.id as number);
        const res = await api.getDropdownsByType(sel.typeKey);
        setDropdownItems(res.items);
        if (sel.typeKey === 'skill_category') await fetchSkillCategories();
      } else if (sel.kind === 'skills') {
        await api.deleteSkill(String(deleteConfirm.id));
        const res = await api.getSkills();
        setAllSkills(res.skills as unknown as SkillItem[]);
      } else if (sel.kind === 'custom-options') {
        await api.deleteCustomFieldOption(sel.field.id, deleteConfirm.id as number);
        const res = await api.getCustomFieldOptions(sel.field.id);
        setCustomOptions(res.options);
      }
      toast(`"${deleteConfirm.name}" deleted`, 'info', 'Deleted');
      setDeleteConfirm(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Add Field dialog ──────────────────────────────────────────────────
  const [addFieldSection, setAddFieldSection] = useState<string | null>(null);
  const [addFieldName, setAddFieldName] = useState('');
  const [addFieldType, setAddFieldType] = useState<'dropdown' | 'text'>('dropdown');
  const [addFieldRequired, setAddFieldRequired] = useState(false);
  const [isCreatingField, setIsCreatingField] = useState(false);

  const handleCreateField = async () => {
    if (!addFieldSection || !addFieldName.trim()) return;
    const sectionDb = sectionKeyToDb(addFieldSection);
    if (!sectionDb) return;
    setIsCreatingField(true);
    try {
      const res = await api.createCustomField(sectionDb, addFieldName.trim(), addFieldType, addFieldRequired);
      toast(`"${addFieldName.trim()}" field created`, 'success', 'Field Created');
      setAddFieldSection(null);
      setAddFieldName('');
      setAddFieldType('dropdown');
      setAddFieldRequired(false);
      await fetchCustomFields();
      if (res.field) {
        setActiveKey(`custom:${res.field.id}`);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to create field', 'error', 'Error');
    } finally {
      setIsCreatingField(false);
    }
  };

  // ── Delete custom field ───────────────────────────────────────────────
  const [deleteFieldConfirm, setDeleteFieldConfirm] = useState<CustomField | null>(null);
  const [isDeletingField, setIsDeletingField] = useState(false);

  const handleDeleteField = async () => {
    if (!deleteFieldConfirm) return;
    setIsDeletingField(true);
    try {
      await api.deleteCustomField(deleteFieldConfirm.id);
      toast(`"${deleteFieldConfirm.label}" field deleted`, 'info', 'Deleted');
      setDeleteFieldConfirm(null);
      await fetchCustomFields();
      setActiveKey('designation');
    } catch (err: any) {
      toast(err.message || 'Failed to delete', 'error', 'Error');
    } finally {
      setIsDeletingField(false);
    }
  };

  // ── Add Section dialog ─────────────────────────────────────────────
  const [showAddSection, setShowAddSection] = useState(false);
  const [addSectionName, setAddSectionName] = useState('');
  const [addSectionAfter, setAddSectionAfter] = useState('domain');
  const [isCreatingSection, setIsCreatingSection] = useState(false);

  const sectionPositionOptions = useMemo(() => {
    return sections.map((s) => ({ key: s.key, label: s.label }));
  }, [sections]);

  const handleCreateSection = async () => {
    if (!addSectionName.trim()) return;
    setIsCreatingSection(true);
    try {
      const res = await api.createCustomSection(addSectionName.trim(), addSectionAfter);
      toast(`"${addSectionName.trim()}" section created`, 'success', 'Section Created');
      setShowAddSection(false);
      setAddSectionName('');
      setAddSectionAfter(sections[sections.length - 1]?.key || 'domain');
      await fetchCustomSections();
      if (res?.section?.id) {
        setActiveKey(`custom_section_${res.section.id}`);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to create section', 'error', 'Error');
    } finally {
      setIsCreatingSection(false);
    }
  };

  // ── Delete Section ────────────────────────────────────────────────────
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState<{ id: number; label: string } | null>(null);
  const [isDeletingSection, setIsDeletingSection] = useState(false);

  const handleDeleteSection = async () => {
    if (!deleteSectionConfirm) return;
    setIsDeletingSection(true);
    try {
      await api.deleteCustomSection(deleteSectionConfirm.id);
      toast(`"${deleteSectionConfirm.label}" section deleted`, 'info', 'Deleted');
      setDeleteSectionConfirm(null);
      await fetchCustomSections();
      await fetchCustomFields();
      setActiveKey('designation');
    } catch (err: any) {
      toast(err.message || 'Failed to delete', 'error', 'Error');
    } finally {
      setIsDeletingSection(false);
    }
  };

  // ── Rename section/field ───────────────────────────────────────────
  const [renameTarget, setRenameTarget] = useState<{
    kind: 'section' | 'field';
    key: string;
    currentLabel: string;
    isSystem: boolean;
    customId?: number;
  } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    setIsRenaming(true);
    try {
      if (renameTarget.isSystem) {
        const isSkillForm = renameTarget.key.startsWith('__skill_form__');
        const overrideKey = isSkillForm
          ? `skill_form:${renameTarget.key.replace('__skill_form__', '')}`
          : `${renameTarget.kind}:${renameTarget.key}`;
        await api.updateOverride(overrideKey, { label: renameValue.trim() });
        await fetchOverrides();
      } else if (renameTarget.kind === 'section' && renameTarget.customId) {
        await api.updateCustomSection(renameTarget.customId, renameValue.trim());
        await fetchCustomSections();
      } else if (renameTarget.kind === 'field' && renameTarget.customId) {
        await api.updateCustomField(renameTarget.customId, renameValue.trim());
        await fetchCustomFields();
      }
      toast(`Renamed to "${renameValue.trim()}"`, 'success', 'Renamed');
      setRenameTarget(null);
    } catch (err: any) {
      toast(err.message || 'Failed to rename', 'error', 'Error');
    } finally {
      setIsRenaming(false);
    }
  };

  // ── Hide system section/field ────────────────────────────────────────
  const [hideTarget, setHideTarget] = useState<{
    kind: 'section' | 'field';
    key: string;
    label: string;
  } | null>(null);
  const [isHiding, setIsHiding] = useState(false);

  const handleHideSystem = async () => {
    if (!hideTarget) return;
    setIsHiding(true);
    try {
      const overrideKey = `${hideTarget.kind}:${hideTarget.key}`;
      await api.updateOverride(overrideKey, { hidden: true });
      await fetchOverrides();
      toast(`"${hideTarget.label}" removed`, 'info', 'Removed');
      setHideTarget(null);
      if (hideTarget.kind === 'field' && activeKey === hideTarget.key) {
        setActiveKey('designation');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to remove', 'error', 'Error');
    } finally {
      setIsHiding(false);
    }
  };

  // Hidden item counts for restore
  const hiddenCount = useMemo(() => {
    return Object.values(overrides).filter((o) => o.hidden).length;
  }, [overrides]);

  // ── Restore hidden system item ───────────────────────────────────────
  const [showRestoreList, setShowRestoreList] = useState(false);

  const hiddenItems = useMemo(() => {
    const items: Array<{ key: string; kind: 'section' | 'field'; defaultLabel: string }> = [];
    const sysSecMap: Record<string, string> = {
      'employee-info': 'Employee Information',
      'technical-skills': 'Technical Skills',
      'domain': 'Domain',
    };
    const sysFieldMap: Record<string, string> = {};
    for (const c of EMP_INFO) sysFieldMap[c.key] = c.label;
    for (const c of DOMAIN_CHILDREN) sysFieldMap[c.key] = c.label;

    for (const [oKey, ov] of Object.entries(overrides)) {
      if (!ov.hidden) continue;
      if (oKey.startsWith('section:')) {
        const sKey = oKey.replace('section:', '');
        items.push({ key: oKey, kind: 'section', defaultLabel: sysSecMap[sKey] || sKey });
      } else if (oKey.startsWith('field:')) {
        const fKey = oKey.replace('field:', '');
        items.push({ key: oKey, kind: 'field', defaultLabel: sysFieldMap[fKey] || fKey });
      }
    }
    return items;
  }, [overrides]);

  const handleRestore = async (overrideKey: string) => {
    try {
      await api.deleteOverride(overrideKey);
      await fetchOverrides();
      toast('Restored', 'success', 'Restored');
    } catch (err: any) {
      toast(err.message || 'Failed to restore', 'error', 'Error');
    }
  };

  // ═════════════════════════════════════════════════════════════════════
  // Render
  // ═════════════════════════════════════════════════════════════════════

  const addPlaceholder = isSkillsMode && sel?.kind === 'skills'
    ? `Add new skill to ${sel.category}...`
    : isCustomMode
    ? `Add new option...`
    : `Add new ${panelLabel.toLowerCase().replace(/s$/, '')}...`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#016DD9] to-[#0148A0] flex items-center justify-center shadow-sm">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0B1B4D] tracking-tight">Master Data</h1>
          <p className="text-xs text-[#64748B]">
            Manage dropdown values, skill catalogs and custom fields
          </p>
        </div>
      </div>

      <div className="flex gap-4 min-h-[calc(100vh-14rem)]">
        {/* ─── LEFT: Hierarchical nav ─────────────────────────────────── */}
        <div className="w-64 shrink-0 bg-white rounded-2xl border border-[#DFE5EE] shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#DFE5EE]">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Form Sections
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {sections.map((section) => {
              const SectionIcon = section.icon;
              const isExp = expanded[section.key] !== false;
              const isCustomSection = section.key.startsWith('custom_section_');
              return (
                <div key={section.key}>
                  {/* Section header */}
                  <div className="flex items-center group/section">
                    <button
                      type="button"
                      onClick={() => {
                        toggleSection(section.key);
                        if (isCustomSection && section.children.length === 0) {
                          setActiveKey(section.key);
                        }
                      }}
                      className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold text-[#0B1B4D] uppercase tracking-wide hover:bg-slate-50 transition-colors cursor-pointer min-w-0"
                    >
                      <SectionIcon className="w-4 h-4 text-[#64748B] shrink-0" />
                      <span className="flex-1 text-left truncate">{section.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${isExp ? '' : '-rotate-90'}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameTarget({
                          kind: 'section',
                          key: section.key,
                          currentLabel: section.label,
                          isSystem: !isCustomSection,
                          customId: isCustomSection ? parseInt(section.key.replace('custom_section_', '')) : undefined,
                        });
                        setRenameValue(section.label);
                      }}
                      className="p-1 rounded text-slate-300 hover:text-[#016DD9] hover:bg-blue-50 transition-all cursor-pointer opacity-0 group-hover/section:opacity-100"
                      title="Rename section"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCustomSection) {
                          const id = parseInt(section.key.replace('custom_section_', ''));
                          setDeleteSectionConfirm({ id, label: section.label });
                        } else {
                          setHideTarget({ kind: 'section', key: section.key, label: section.label });
                        }
                      }}
                      className="p-1 rounded text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer mr-1"
                      title="Delete section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-3 space-y-0.5 pb-1">
                          {section.children.map((child) => {
                            const ChildIcon = child.icon;
                            const isActive = activeKey === child.key;
                            const isSystemField = !child.isCustom && !child.isSkillDot;
                            return (
                              <div key={child.key} className="flex items-center group/item">
                                <button
                                  type="button"
                                  onClick={() => setActiveKey(child.key)}
                                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer min-w-0 ${
                                    isActive
                                      ? 'bg-[#016DD9]/10 text-[#016DD9] font-bold'
                                      : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0B1B4D]'
                                  }`}
                                >
                                  {child.isSkillDot ? (
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-[#016DD9]' : 'bg-[#CBD5E1]'}`} />
                                  ) : (
                                    <ChildIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#016DD9]' : 'text-[#94A3B8]'}`} />
                                  )}
                                  <span className="truncate">{child.label}</span>
                                  {child.isCustom && child.selection.kind === 'custom-options' && child.selection.field.is_required === 1 && (
                                    <span className="text-rose-500 text-[10px] font-bold shrink-0">*</span>
                                  )}
                                  {child.isSkillDot && (
                                    <ChevronRight className={`w-3 h-3 shrink-0 ml-auto ${isActive ? 'text-[#016DD9]' : 'text-[#CBD5E1]'}`} />
                                  )}
                                </button>
                                {!child.isSkillDot && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRenameTarget({
                                          kind: 'field',
                                          key: child.key,
                                          currentLabel: child.label,
                                          isSystem: isSystemField,
                                          customId: child.isCustom && child.selection.kind === 'custom-options' ? child.selection.field.id : undefined,
                                        });
                                        setRenameValue(child.label);
                                      }}
                                      className="p-1 rounded text-slate-300 hover:text-[#016DD9] hover:bg-blue-50 transition-all cursor-pointer opacity-0 group-hover/item:opacity-100"
                                      title="Rename field"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (child.isCustom && child.selection.kind === 'custom-options') {
                                          setDeleteFieldConfirm(child.selection.field);
                                        } else if (isSystemField) {
                                          setHideTarget({ kind: 'field', key: child.key, label: child.label });
                                        }
                                      }}
                                      className="p-1 rounded text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer mr-1"
                                      title="Delete field"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}

                          {/* Add Field button */}
                          {section.canAddField && (
                            <button
                              type="button"
                              onClick={() => {
                                setAddFieldSection(section.key);
                                setAddFieldName('');
                                setAddFieldType('dropdown');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-[#94A3B8] hover:text-[#016DD9] hover:bg-blue-50/50 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Field</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Add Section button */}
            <div className="px-2 pt-2 pb-1 border-t border-[#F1F5F9] mt-1">
              <button
                type="button"
                onClick={() => {
                  setShowAddSection(true);
                  setAddSectionName('');
                  setAddSectionAfter(sections[sections.length - 1]?.key || 'review');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold text-[#94A3B8] hover:text-[#016DD9] hover:bg-blue-50/50 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Section</span>
              </button>
            </div>

            {/* Restore hidden items */}
            {hiddenCount > 0 && (
              <div className="px-2 pb-2 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowRestoreList(!showRestoreList)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium text-[#94A3B8] hover:text-amber-600 hover:bg-amber-50/50 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{hiddenCount} hidden item{hiddenCount > 1 ? 's' : ''}</span>
                  <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showRestoreList ? '' : '-rotate-90'}`} />
                </button>
                <AnimatePresence initial={false}>
                  {showRestoreList && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-3 space-y-0.5 pb-1">
                        {hiddenItems.map((item) => (
                          <div key={item.key} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-[#94A3B8]">
                            <span className="flex-1 truncate line-through">{item.defaultLabel}</span>
                            <button
                              type="button"
                              onClick={() => handleRestore(item.key)}
                              className="text-[10px] font-medium text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>
        </div>

        {/* ─── RIGHT: Values panel ────────────────────────────────────── */}
        <div className="flex-1 bg-white rounded-2xl border border-[#DFE5EE] shadow-sm flex flex-col overflow-hidden">
          {!activeChild && activeSection && activeSection.key.startsWith('custom_section_') ? (
            <div className="p-8 flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#016DD9] flex items-center justify-center">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1B4D]">{activeSection.label}</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  {activeSection.children.length === 0
                    ? 'This section does not have any fields yet. Add your first field to start configuring master data.'
                    : `This section has ${activeSection.children.length} custom field(s). Select a field from the sidebar or add another field.`}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddFieldSection(activeSection.key);
                    setAddFieldName('');
                    setAddFieldType('dropdown');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#016DD9] hover:bg-[#0158B0] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Field</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = parseInt(activeSection.key.replace('custom_section_', ''));
                    setDeleteSectionConfirm({ id, label: activeSection.label });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Section</span>
                </button>
              </div>
            </div>
          ) : (
            <>
          {/* Panel header */}
          <div className="px-5 py-4 border-b border-[#DFE5EE] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {activeChild && (
                isSkillsMode ? (
                  <Code2 className="w-5 h-5 text-[#016DD9]" />
                ) : isCustomMode ? (
                  <Settings2 className="w-5 h-5 text-[#016DD9]" />
                ) : (
                  React.createElement(activeChild.icon, { className: 'w-5 h-5 text-[#016DD9]' })
                )
              )}
              <h2 className="text-base font-bold text-[#0B1B4D]">{panelLabel}</h2>
              <span className="text-xs text-[#94A3B8] font-medium">
                {rawItems.length} item{rawItems.length !== 1 ? 's' : ''}
              </span>
              {isCustomMode && sel?.kind === 'custom-options' && (
                <>
                  <span className="text-[10px] font-medium bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded">
                    Custom
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const field = sel.field;
                      const newRequired = !field.is_required;
                      try {
                        await api.updateCustomField(field.id, field.label, newRequired);
                        toast(newRequired ? 'Marked as required' : 'Marked as optional', 'success', 'Updated');
                        await fetchCustomFields();
                      } catch (err: any) {
                        toast(err.message || 'Failed to update', 'error', 'Error');
                      }
                    }}
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      sel.field.is_required
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                        : 'bg-slate-50 text-[#94A3B8] border border-[#DFE5EE] hover:bg-slate-100 hover:text-[#64748B]'
                    }`}
                    title={sel.field.is_required ? 'Click to make optional' : 'Click to make required'}
                  >
                    {sel.field.is_required ? 'Required *' : 'Optional'}
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-48 text-xs border border-[#DFE5EE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#016DD9]/20 focus:border-[#016DD9] bg-[#F8FAFC] placeholder-[#94A3B8]"
                />
              </div>
              <button
                type="button"
                onClick={fetchData}
                title="Refresh"
                className="p-1.5 rounded-lg border border-[#DFE5EE] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {activeChild && !activeChild.isSkillDot && (
                <button
                  type="button"
                  onClick={() => {
                    const isSystem = !activeChild.isCustom;
                    setRenameTarget({
                      kind: 'field',
                      key: activeChild.key,
                      currentLabel: activeChild.label,
                      isSystem,
                      customId: activeChild.isCustom && activeChild.selection.kind === 'custom-options' ? activeChild.selection.field.id : undefined,
                    });
                    setRenameValue(activeChild.label);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#016DD9] border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Rename this field"
                >
                  <Pencil className="w-3 h-3" />
                  Rename
                </button>
              )}
              {isCustomMode && sel?.kind === 'custom-options' && (
                <button
                  type="button"
                  onClick={() => setDeleteFieldConfirm(sel.field)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-500 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete this custom field"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Field
                </button>
              )}
              {isDropdownMode && activeChild && !activeChild.isCustom && (
                <button
                  type="button"
                  onClick={() => setHideTarget({ kind: 'field', key: activeChild.key, label: activeChild.label })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-500 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove this field from the list"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Field
                </button>
              )}
              {isActiveInCustomSection && activeSection && (
                <button
                  type="button"
                  onClick={() => {
                    const id = parseInt(activeSection.key.replace('custom_section_', ''));
                    setDeleteSectionConfirm({ id, label: activeSection.label });
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-500 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete this custom section"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Section
                </button>
              )}
            </div>
          </div>

          {/* Add new row / Text field info */}
          {isTextFieldMode ? (
            <div className="px-5 py-4 border-b border-[#DFE5EE] bg-[#F8FAFC]">
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <FileText className="w-4 h-4 text-[#94A3B8]" />
                <span>This is a <strong className="text-[#0B1B4D]">text input</strong> field — no dropdown options needed.</span>
              </div>
            </div>
          ) : (
          <div className="px-5 py-3 border-b border-[#DFE5EE] bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={addPlaceholder}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newValue.trim()) handleAdd(); }}
                className="flex-1 px-3 py-2 text-sm border border-[#DFE5EE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#016DD9]/20 focus:border-[#016DD9] bg-white placeholder-[#94A3B8]"
              />
              {hasEmailColumn && (
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newValue.trim()) handleAdd(); }}
                  className="w-56 px-3 py-2 text-sm border border-[#DFE5EE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#016DD9]/20 focus:border-[#016DD9] bg-white placeholder-[#94A3B8]"
                />
              )}
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newValue.trim() || isAdding}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#016DD9] hover:bg-[#0158B0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add
              </button>
            </div>
          </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading && displayItems.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-[#016DD9] animate-spin" />
              </div>
            ) : displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#94A3B8]">
                <Database className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">{searchQuery ? 'No matching items' : 'No items yet'}</p>
                <p className="text-xs mt-1">{searchQuery ? 'Try a different search' : 'Add the first item above'}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#DFE5EE] bg-[#F8FAFC]">
                    <th className="text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-5 py-2.5 w-12">#</th>
                    <th className="text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-3 py-2.5">Name</th>
                    {hasEmailColumn && (
                      <th className="text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-3 py-2.5">Email</th>
                    )}
                    <th className="text-right text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-5 py-2.5 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {displayItems.map((item: any, idx: number) => {
                      const isEditing = editingId === item.id;
                      const displayName = item.name ?? item.value ?? '';
                      return (
                        <motion.tr
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.15 }}
                          className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] group"
                        >
                          <td className="px-5 py-2.5 text-xs text-[#94A3B8] font-mono">{idx + 1}</td>
                          <td className="px-3 py-2.5">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                                autoFocus
                                className="w-full px-2 py-1 text-sm border border-[#016DD9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#016DD9]/20 bg-white"
                              />
                            ) : (
                              <span className="text-sm text-[#0B1B4D] font-medium">{displayName}</span>
                            )}
                          </td>
                          {hasEmailColumn && (
                            <td className="px-3 py-2.5">
                              {isEditing ? (
                                <input
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                                  className="w-full px-2 py-1 text-sm border border-[#016DD9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#016DD9]/20 bg-white"
                                />
                              ) : (
                                <span className="text-xs text-[#64748B]">{item.email || '—'}</span>
                              )}
                            </td>
                          )}
                          <td className="px-5 py-2.5 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button type="button" onClick={handleSaveEdit} disabled={!editValue.trim() || isSaving} className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer" title="Save">
                                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button type="button" onClick={handleCancelEdit} className="p-1.5 rounded-md bg-slate-50 text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer" title="Cancel">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-md bg-blue-50 text-[#016DD9] hover:bg-blue-100 transition-colors cursor-pointer" title="Edit">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => setDeleteConfirm({ id: item.id, name: displayName })} className="p-1.5 rounded-md bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors cursor-pointer" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          {displayItems.length > 0 && (
            <div className="px-5 py-2.5 border-t border-[#DFE5EE] bg-[#F8FAFC]">
              <p className="text-[11px] text-[#94A3B8]">
                Showing {displayItems.length} of {rawItems.length} item{rawItems.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* ═══ Delete Item Modal ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => { setDeleteConfirm(null); setDeleteError(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-[#DFE5EE] p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1B4D]">Delete Item</h3>
                  <p className="text-xs text-[#64748B]">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-[#334155]">
                Delete <strong>"{deleteConfirm.name}"</strong> from {panelLabel}?
              </p>
              {usageLoading && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-[#DFE5EE] text-xs text-[#64748B]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Checking employee usage...
                </div>
              )}
              {!usageLoading && usageCount !== null && usageCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    In use by {usageCount} employee{usageCount !== 1 ? 's' : ''}
                  </div>
                  <span className="text-amber-700">Deleting this will remove the value from {usageCount} employee record{usageCount !== 1 ? 's' : ''} and recalculate their profile completion.</span>
                </div>
              )}
              {!usageLoading && usageCount !== null && usageCount === 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                  Not used by any employees — safe to delete.
                </div>
              )}
              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{deleteError}</div>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setDeleteConfirm(null); setDeleteError(null); }} className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0B1B4D] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={handleDelete} disabled={isDeleting || usageLoading} className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {usageCount && usageCount > 0 ? 'Delete & Remove from Employees' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Add Field Modal ═════════════════════════════════════════════ */}
      <AnimatePresence>
        {addFieldSection && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setAddFieldSection(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-[#DFE5EE] p-6 w-full max-w-md space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#016DD9]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1B4D]">Add New Field</h3>
                  <p className="text-xs text-[#64748B]">
                    Create a new field under{' '}
                    <strong>{sections.find((s) => s.key === addFieldSection)?.label}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Field Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Certifications, Band Level..."
                    value={addFieldName}
                    onChange={(e) => setAddFieldName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && addFieldName.trim()) handleCreateField(); }}
                    autoFocus
                    className="w-full px-3 py-2.5 text-sm border border-[#DFE5EE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#016DD9]/20 focus:border-[#016DD9] bg-white placeholder-[#94A3B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-2">Does this field need a dropdown?</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${addFieldType === 'dropdown' ? 'border-[#016DD9] bg-blue-50/50' : 'border-[#DFE5EE] hover:border-[#CBD5E1]'}`}>
                      <input type="radio" name="field_type" checked={addFieldType === 'dropdown'} onChange={() => setAddFieldType('dropdown')} className="sr-only" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${addFieldType === 'dropdown' ? 'border-[#016DD9]' : 'border-[#CBD5E1]'}`}>
                        {addFieldType === 'dropdown' && <div className="w-2 h-2 rounded-full bg-[#016DD9]" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0B1B4D]">Yes, Dropdown</p>
                        <p className="text-[11px] text-[#64748B]">Predefined list of options</p>
                      </div>
                    </label>
                    <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${addFieldType === 'text' ? 'border-[#016DD9] bg-blue-50/50' : 'border-[#DFE5EE] hover:border-[#CBD5E1]'}`}>
                      <input type="radio" name="field_type" checked={addFieldType === 'text'} onChange={() => setAddFieldType('text')} className="sr-only" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${addFieldType === 'text' ? 'border-[#016DD9]' : 'border-[#CBD5E1]'}`}>
                        {addFieldType === 'text' && <div className="w-2 h-2 rounded-full bg-[#016DD9]" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0B1B4D]">No, Text</p>
                        <p className="text-[11px] text-[#64748B]">Free-form text input</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={addFieldRequired}
                      onClick={() => setAddFieldRequired(!addFieldRequired)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${addFieldRequired ? 'bg-[#016DD9]' : 'bg-[#CBD5E1]'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${addFieldRequired ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <div>
                      <p className="text-sm font-semibold text-[#0B1B4D]">Required Field</p>
                      <p className="text-[11px] text-[#64748B]">{addFieldRequired ? 'This field must be filled in the employee form' : 'Optional — can be left empty'}</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setAddFieldSection(null)} className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0B1B4D] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateField}
                  disabled={!addFieldName.trim() || isCreatingField}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#016DD9] hover:bg-[#0158B0] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {isCreatingField ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create Field
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Delete Field Modal ══════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteFieldConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setDeleteFieldConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-[#DFE5EE] p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1B4D]">Delete Field</h3>
                  <p className="text-xs text-[#64748B]">This will also delete all its options</p>
                </div>
              </div>
              <p className="text-sm text-[#334155]">
                Delete the field <strong>"{deleteFieldConfirm.label}"</strong> and all its dropdown options?
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setDeleteFieldConfirm(null)} className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0B1B4D] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={handleDeleteField} disabled={isDeletingField} className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                  {isDeletingField ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete Field
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Add Section Modal ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {showAddSection && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setShowAddSection(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-[#DFE5EE] p-6 w-full max-w-md space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#016DD9]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1B4D]">Add New Section</h3>
                  <p className="text-xs text-[#64748B]">Create a new heading in the Master Data</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Section Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Training, Compliance..."
                    value={addSectionName}
                    onChange={(e) => setAddSectionName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && addSectionName.trim()) handleCreateSection(); }}
                    autoFocus
                    className="w-full px-3 py-2.5 text-sm border border-[#DFE5EE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#016DD9]/20 focus:border-[#016DD9] bg-white placeholder-[#94A3B8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Place after</label>
                  <select
                    value={addSectionAfter}
                    onChange={(e) => setAddSectionAfter(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-[#DFE5EE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#016DD9]/20 focus:border-[#016DD9] bg-white text-[#0B1B4D] cursor-pointer"
                  >
                    {sectionPositionOptions.map((opt) => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAddSection(false)} className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0B1B4D] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSection}
                  disabled={!addSectionName.trim() || isCreatingSection}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#016DD9] hover:bg-[#0158B0] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {isCreatingSection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create Section
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Delete Section Modal ════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteSectionConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setDeleteSectionConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-[#DFE5EE] p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1B4D]">Delete Section</h3>
                  <p className="text-xs text-[#64748B]">This will delete the section and all its fields</p>
                </div>
              </div>
              <p className="text-sm text-[#334155]">
                Delete <strong>"{deleteSectionConfirm.label}"</strong> and all its fields and options?
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setDeleteSectionConfirm(null)} className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0B1B4D] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={handleDeleteSection} disabled={isDeletingSection} className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                  {isDeletingSection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete Section
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Rename Modal ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {renameTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setRenameTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-[#DFE5EE] p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-[#016DD9]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1B4D]">
                    Rename {renameTarget.kind === 'section' ? 'Section' : 'Field'}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Change the display label
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">New Name</label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && renameValue.trim()) handleRename(); }}
                  autoFocus
                  className="w-full px-3 py-2.5 text-sm border border-[#DFE5EE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#016DD9]/20 focus:border-[#016DD9] bg-white placeholder-[#94A3B8]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setRenameTarget(null)} className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0B1B4D] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRename}
                  disabled={!renameValue.trim() || renameValue.trim() === renameTarget.currentLabel || isRenaming}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#016DD9] hover:bg-[#0158B0] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {isRenaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Rename
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Hide System Item Modal ══════════════════════════════════════ */}
      <AnimatePresence>
        {hideTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setHideTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-[#DFE5EE] p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1B4D]">
                    Remove {hideTarget.kind === 'section' ? 'Section' : 'Field'}
                  </h3>
                  <p className="text-xs text-[#64748B]">You can restore it later from the hidden items list</p>
                </div>
              </div>
              <p className="text-sm text-[#334155]">
                Remove <strong>"{hideTarget.label}"</strong> from the Master Data list?
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setHideTarget(null)} className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0B1B4D] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={handleHideSystem} disabled={isHiding} className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                  {isHiding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
