import { useState, useEffect, useCallback, useMemo } from 'react';
import { StoredApplication, MerchantApplication, CURRENT_PROVIDERS, PUSH_PROVIDERS, PushProviderId } from '@/types/application';
import { getApplications, saveApplication } from '@/lib/applicationsStore';
import { getActivityLog, addActivityEvent, pushApplication } from '@/lib/activityStore';
import { formatPhone } from '@/lib/formatPhone';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Pencil, Check, ArrowLeft,
  Building2, Users, CreditCard, Landmark, FileText as FileTextIcon,
  ArrowUpDown, Filter, Save, Send, History, RotateCw,
} from 'lucide-react';
import DocThumbnail from '@/components/DocThumbnail';
import ReadOnlyField from '@/components/ReadOnlyField';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PushAppModal from '@/components/PushAppModal';
import ActivityTrail from '@/components/ActivityTrail';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'pre-qual': { label: 'Pre-Qualified', color: 'bg-primary/10 text-primary' },
  'pre-qual-failed': { label: 'Not Qualified', color: 'bg-destructive/10 text-destructive' },
  'in-progress': { label: 'In Progress', color: 'bg-warning/10 text-warning' },
  'submitted': { label: 'Submitted', color: 'bg-accent/10 text-accent' },
};

const TITLES = [
  'CEO', 'CFO', 'COO', 'CTO', 'President', 'Vice President',
  'Owner', 'Co-Owner', 'Managing Member', 'General Partner',
  'Limited Partner', 'Director', 'Secretary', 'Treasurer',
  'Sole Proprietor', 'Partner', 'Authorized Signer', 'Other',
];

type SortField = 'date' | 'company' | 'volume' | 'status';
type SortDir = 'asc' | 'desc';

const SectionHeader = ({
  title,
  editing,
  onStartEdit,
  onSave,
  onCancel,
}: {
  title: string;
  sectionNumber?: number;
  editing: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-base font-bold text-foreground">{title}</h3>
    {editing ? (
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
        <button onClick={onSave} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> Save
        </button>
      </div>
    ) : (
      <button
        onClick={onStartEdit}
        className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors font-medium px-2.5 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10"
      >
        <Pencil className="w-3 h-3" />
        Edit
      </button>
    )}
  </div>
);

const ApplicationsPage = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<StoredApplication[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StoredApplication | null>(null);
  const [editData, setEditData] = useState<MerchantApplication | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('preQual');
  const [unsavedDialog, setUnsavedDialog] = useState<{ action: () => void } | null>(null);
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [resending, setResending] = useState<string | null>(null);

  const handleResend = async (providerId: PushProviderId) => {
    if (!selected || resending) return;
    const provider = PUSH_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;
    setResending(providerId);
    try {
      await pushApplication(selected.id, providerId, provider.name);
    } catch {}
    setResending(null);
    const freshApps = getApplications();
    const freshApp = freshApps.find((a) => a.id === selected.id);
    if (freshApp) setSelected(freshApp);
    refresh();
  };

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const refresh = useCallback(() => setApps(getApplications()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const uniqueProviders = useMemo(() => {
    const providers = new Set<string>();
    apps.forEach((a) => {
      if (a.data.preQualification.currentProvider) providers.add(a.data.preQualification.currentProvider);
    });
    return Array.from(providers).sort();
  }, [apps]);

  const filtered = useMemo(() => {
    let result = apps.filter((a) => {
      const q = search.toLowerCase();
      const p = a.data.preQualification.principals[0];
      const name = `${p?.firstName} ${p?.lastName}`.toLowerCase();
      const company = a.data.preQualification.companyName?.toLowerCase() || '';
      const email = p?.email?.toLowerCase() || '';
      const matchSearch = name.includes(q) || company.includes(q) || email.includes(q) || a.status.includes(q);
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchProvider = providerFilter === 'all' || a.data.preQualification.currentProvider === providerFilter;
      return matchSearch && matchStatus && matchProvider;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'company':
          cmp = (a.data.preQualification.companyName || '').localeCompare(b.data.preQualification.companyName || '');
          break;
        case 'volume':
          cmp = (Number(a.data.preQualification.monthlyVolume) || 0) - (Number(b.data.preQualification.monthlyVolume) || 0);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [apps, search, statusFilter, providerFilter, sortField, sortDir]);

  const openApp = (app: StoredApplication) => {
    setSelected(app);
    setEditingSection(null);
    setEditData(JSON.parse(JSON.stringify(app.data)));
    setActiveTab('preQual');
  };

  const startSectionEdit = (section: string) => {
    setEditingSection(section);
    setEditData(JSON.parse(JSON.stringify(selected!.data)));
  };

  const saveSectionEdit = () => {
    if (!selected || !editData) return;
    const updated = { ...selected, data: editData };
    saveApplication(updated);
    setSelected(updated);
    setEditingSection(null);
    refresh();
  };

  const cancelSectionEdit = () => {
    setEditingSection(null);
    setEditData(JSON.parse(JSON.stringify(selected!.data)));
  };

  const guardedAction = (action: () => void) => {
    if (editingSection) {
      setUnsavedDialog({ action });
    } else {
      action();
    }
  };

  const handleTabSwitch = (tabId: string) => {
    guardedAction(() => {
      setActiveTab(tabId);
      setEditingSection(null);
    });
  };

  const handleCloseModal = () => {
    guardedAction(() => {
      setSelected(null);
      setEditingSection(null);
    });
  };

  const updateField = (path: string, value: any) => {
    if (!editData) return;
    const clone = JSON.parse(JSON.stringify(editData));
    const keys = path.split('.');
    let obj: any = clone;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setEditData(clone);
  };

  const tabs = [
    { id: 'preQual', label: 'Pre-App', icon: Users },
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'processing', label: 'Processing', icon: CreditCard },
    { id: 'ownership', label: 'Ownership', icon: Users },
    { id: 'banking', label: 'Banking', icon: Landmark },
    { id: 'documents', label: 'Documents', icon: FileTextIcon },
    { id: 'activity', label: 'Activity', icon: History },
  ];

  const EditField = ({ label, path, type = 'text', options }: { label: string; path: string; type?: string; options?: string[] }) => {
    const keys = path.split('.');
    let val: any = editData;
    for (const k of keys) val = val?.[k];

    if (options) {
      return (
        <div>
          <label className="field-label">{label}</label>
          <select className="field-input" value={val || ''} onChange={(e) => updateField(path, e.target.value)}>
            <option value="">Select...</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }

    return (
      <div>
        <label className="field-label">{label}</label>
        <input
          type={type}
          className="field-input"
          value={val ?? ''}
          onChange={(e) => {
            const v = type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value;
            updateField(path, type === 'tel' ? formatPhone(e.target.value) : v);
          }}
        />
      </div>
    );
  };

  const SortHeader = ({ label, field, className }: { label: string; field: SortField; className?: string }) => (
    <th
      className={`text-left text-xs font-semibold text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground select-none ${className || ''}`}
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'opacity-40'}`} />
      </div>
    </th>
  );

  const renderModalContent = () => {
    if (!selected) return null;
    const d = editingSection ? editData! : selected.data;
    const pq = d.preQualification || {} as any;
    const bp = d.businessProfile || {} as any;
    const pp = d.processingProfile || {} as any;
    const bk = d.banking || {} as any;
    const docs = d.documents || {} as any;
    const isEditing = (section: string) => editingSection === section;

    return (
      <div className="space-y-6">
        {activeTab === 'preQual' && (
          <>
            {/* Pre-Qual Details */}
            <section>
              <SectionHeader title="Pre-Qualification Details" sectionNumber={1} editing={isEditing('preQual')} onStartEdit={() => startSectionEdit('preQual')} onSave={saveSectionEdit} onCancel={cancelSectionEdit} />
              {isEditing('preQual') ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <EditField label="Company Name" path="preQualification.companyName" />
                    <EditField label="Location" path="preQualification.location" options={['US', 'Canada', 'International']} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <EditField label="Monthly Volume" path="preQualification.monthlyVolume" type="number" />
                    <EditField label="Average Ticket" path="preQualification.averageTicket" type="number" />
                    <EditField label="Current Provider" path="preQualification.currentProvider" options={CURRENT_PROVIDERS} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyField label="Company Name" value={pq.companyName} />
                    <ReadOnlyField label="Location" value={pq.location} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ReadOnlyField label="Monthly Volume" value={pq.monthlyVolume ? `$${Number(pq.monthlyVolume).toLocaleString()}` : ''} />
                    <ReadOnlyField label="Average Ticket" value={pq.averageTicket ? `$${Number(pq.averageTicket).toLocaleString()}` : ''} />
                    <ReadOnlyField label="Current Provider" value={pq.currentProvider} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyField label="Stripe Kickoff" value={pq.wasKickedOffStripe === true ? 'Yes' : pq.wasKickedOffStripe === false ? 'No' : '—'} />
                    <ReadOnlyField label="Business Bank Account" value={pq.hasBusinessBankAccount === true ? 'Yes' : pq.hasBusinessBankAccount === false ? 'No' : '—'} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ReadOnlyField label="Has Photo ID" value={pq.hasPhotoId ? 'Yes' : 'No'} />
                    <ReadOnlyField label="Has Bank Statement" value={pq.hasBankStatement ? 'Yes' : 'No'} />
                    <ReadOnlyField label="Has SSN/EIN" value={pq.hasSsnEin ? 'Yes' : 'No'} />
                  </div>
                </div>
              )}
            </section>

            <div className="border-t border-border/40" />

            {/* Principals */}
            <section>
              <SectionHeader title="Principals" sectionNumber={2} editing={isEditing('principals')} onStartEdit={() => startSectionEdit('principals')} onSave={saveSectionEdit} onCancel={cancelSectionEdit} />
              <div className="space-y-6">
                {pq.principals.map((p, i) => (
                  <div key={p.id} className={`space-y-4 ${i > 0 ? 'pt-4 border-t border-dashed border-border/50' : ''}`}>
                    <h4 className="text-sm font-semibold text-foreground">{i === 0 ? 'Primary Principal' : `Principal ${i + 1}`}</h4>
                    {isEditing('principals') ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <EditField label="First Name" path={`preQualification.principals.${i}.firstName`} />
                          <EditField label="Last Name" path={`preQualification.principals.${i}.lastName`} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <EditField label="Email" path={`preQualification.principals.${i}.email`} />
                          <EditField label="Phone" path={`preQualification.principals.${i}.phone`} type="tel" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <EditField label="Title" path={`preQualification.principals.${i}.title`} options={TITLES} />
                          <EditField label="Ownership %" path={`preQualification.principals.${i}.ownershipPercent`} type="number" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ReadOnlyField label="First Name" value={p.firstName} />
                          <ReadOnlyField label="Last Name" value={p.lastName} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ReadOnlyField label="Email" value={p.email} />
                          <ReadOnlyField label="Phone" value={p.phone} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ReadOnlyField label="Title" value={p.title} />
                          <ReadOnlyField label="Ownership %" value={`${p.ownershipPercent}%`} />
                        </div>
                        <ReadOnlyField label="Best Time to Contact" value={p.bestTimeToContact} optional />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {selected.failReason && (
              <>
                <div className="border-t border-border/40" />
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive font-medium">Fail Reason: {selected.failReason}</p>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'business' && (
          <section>
            <SectionHeader title="Business Profile" sectionNumber={1} editing={isEditing('business')} onStartEdit={() => startSectionEdit('business')} onSave={saveSectionEdit} onCancel={cancelSectionEdit} />
            {isEditing('business') ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <EditField label="Legal Name" path="businessProfile.legalName" />
                  <EditField label="DBA" path="businessProfile.dba" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <EditField label="Structure" path="businessProfile.businessStructure" />
                  <EditField label="Industry" path="businessProfile.industryType" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <EditField label="EIN" path="businessProfile.ein" />
                  <EditField label="SSN" path="businessProfile.ssn" />
                  <EditField label="Business Start Date" path="businessProfile.businessStartDate" type="date" />
                </div>
                <EditField label="Street Address" path="businessProfile.streetAddress" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <EditField label="City" path="businessProfile.city" />
                  <EditField label="State" path="businessProfile.state" />
                  <EditField label="ZIP" path="businessProfile.zip" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <EditField label="Phone" path="businessProfile.phoneNumber" type="tel" />
                  <EditField label="Website" path="businessProfile.websiteUrl" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReadOnlyField label="Legal Business Name" value={bp.legalName} />
                  <ReadOnlyField label="DBA (Doing Business As)" value={bp.dba} optional />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReadOnlyField label="Business Structure" value={bp.businessStructure} />
                  <ReadOnlyField label="Industry Type" value={bp.industryType} />
                </div>
                {bp.ein && <ReadOnlyField label="EIN (Employer ID)" value={bp.ein} />}
                {bp.ssn && <ReadOnlyField label="SSN" value={`***-**-${bp.ssn.replace(/\D/g, '').slice(-4)}`} />}
                <ReadOnlyField label="Business Start Date" value={bp.businessStartDate} />
                <div>
                  <label className="field-label">Physical Business Address</label>
                  <div className="field-input bg-secondary/50 cursor-default text-foreground mb-3">
                    {bp.streetAddress || '—'}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="field-input bg-secondary/50 cursor-default text-foreground">{bp.city || '—'}</div>
                    <div className="field-input bg-secondary/50 cursor-default text-foreground">{bp.state || '—'}</div>
                    <div className="field-input bg-secondary/50 cursor-default text-foreground">{bp.zip || '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReadOnlyField label="Business Phone" value={bp.phoneNumber} />
                  <ReadOnlyField label="Website URL" value={bp.websiteUrl} optional />
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'processing' && (
          <>
          <section>
            <SectionHeader title="Processing Profile" sectionNumber={1} editing={isEditing('processing')} onStartEdit={() => startSectionEdit('processing')} onSave={saveSectionEdit} onCancel={cancelSectionEdit} />
            {isEditing('processing') ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <EditField label="Monthly Volume" path="processingProfile.monthlyVolume" type="number" />
                  <EditField label="Avg Ticket" path="processingProfile.averageTicket" type="number" />
                  <EditField label="High Ticket" path="processingProfile.highTicket" type="number" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <EditField label="Card Present %" path="processingProfile.cardPresentPercent" type="number" />
                  <EditField label="Card Not Present %" path="processingProfile.cardNotPresentPercent" type="number" />
                </div>
                {(editData?.processingProfile.cardNotPresentPercent || 0) > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <EditField label="E-Commerce %" path="processingProfile.ecommercePercent" type="number" />
                    <EditField label="Mail Order %" path="processingProfile.mailOrderPercent" type="number" />
                    <EditField label="Phone Order %" path="processingProfile.phoneOrderPercent" type="number" />
                  </div>
                )}
                <EditField label="Refund Policy URL" path="processingProfile.refundPolicyUrl" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ReadOnlyField label="Monthly Volume" value={pp.monthlyVolume ? `$${Number(pp.monthlyVolume).toLocaleString()}` : ''} />
                  <ReadOnlyField label="Average Ticket" value={pp.averageTicket ? `$${Number(pp.averageTicket).toLocaleString()}` : ''} />
                  <ReadOnlyField label="High Ticket" value={pp.highTicket ? `$${Number(pp.highTicket).toLocaleString()}` : ''} />
                </div>
                <div>
                  <label className="field-label">Transaction Split</label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div>
                      <label className="text-xs text-muted-foreground">Card-Present %</label>
                      <div className="field-input bg-secondary/50 cursor-default text-foreground mt-1">{pp.cardPresentPercent}%</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Card-Not-Present %</label>
                      <div className="field-input bg-secondary/50 cursor-default text-foreground mt-1">{pp.cardNotPresentPercent}%</div>
                    </div>
                  </div>
                  {(pp.cardPresentPercent > 0 || pp.cardNotPresentPercent > 0) && (
                    <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden flex">
                      <div className="bg-primary transition-all duration-300" style={{ width: `${pp.cardPresentPercent}%` }} />
                      <div className="bg-accent transition-all duration-300" style={{ width: `${pp.cardNotPresentPercent}%` }} />
                    </div>
                  )}
                </div>
                {pp.cardNotPresentPercent > 0 && (
                  <div>
                    <label className="field-label">Card-Not-Present Breakdown</label>
                    <div className="grid grid-cols-3 gap-3 mt-1">
                      <div>
                        <label className="text-xs text-muted-foreground">E-Commerce %</label>
                        <div className="field-input bg-secondary/50 cursor-default text-foreground mt-1">{pp.ecommercePercent}%</div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Mail Order %</label>
                        <div className="field-input bg-secondary/50 cursor-default text-foreground mt-1">{pp.mailOrderPercent}%</div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Phone Order %</label>
                        <div className="field-input bg-secondary/50 cursor-default text-foreground mt-1">{pp.phoneOrderPercent}%</div>
                      </div>
                    </div>
                  </div>
                )}
                {pp.refundPolicyUrl && <ReadOnlyField label="Refund Policy URL" value={pp.refundPolicyUrl} />}
              </div>
            )}
          </section>

          <div className="border-t border-border/40" />

          <section>
            <SectionHeader title="ACH Processing" sectionNumber={2} editing={isEditing('ach')} onStartEdit={() => startSectionEdit('ach')} onSave={saveSectionEdit} onCancel={cancelSectionEdit} />
            {isEditing('ach') ? (
              <div className="space-y-3">
                <div>
                  <label className="field-label">Do you currently accept ACH payments?</label>
                  <div className="flex gap-3 mt-1">
                    {[true, false].map((val) => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => updateField('processingProfile.acceptsAch', val)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          editData?.processingProfile.acceptsAch === val
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                            : 'border-border hover:border-primary/30 text-muted-foreground'
                        }`}
                      >
                        {val ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
                {editData?.processingProfile.acceptsAch && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <EditField label="ACH Monthly Volume" path="processingProfile.achMonthlyVolume" type="number" />
                      <EditField label="ACH Average Ticket" path="processingProfile.achAverageTicket" type="number" />
                      <EditField label="ACH High Ticket" path="processingProfile.achHighTicket" type="number" />
                    </div>
                    <EditField label="ACH Current Provider" path="processingProfile.achCurrentProvider" />
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <ReadOnlyField label="Accepts ACH Payments" value={pp.acceptsAch ? 'Yes' : 'No'} />
                {pp.acceptsAch && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ReadOnlyField label="ACH Monthly Volume" value={pp.achMonthlyVolume ? `$${Number(pp.achMonthlyVolume).toLocaleString()}` : ''} />
                      <ReadOnlyField label="ACH Average Ticket" value={pp.achAverageTicket ? `$${Number(pp.achAverageTicket).toLocaleString()}` : ''} />
                      <ReadOnlyField label="ACH High Ticket" value={pp.achHighTicket ? `$${Number(pp.achHighTicket).toLocaleString()}` : ''} />
                    </div>
                    <ReadOnlyField label="ACH Current Provider" value={pp.achCurrentProvider} />
                  </>
                )}
              </div>
            )}
          </section>
          </>
        )}

        {activeTab === 'ownership' && (
          <section>
            <SectionHeader title="Ownership & Principals" sectionNumber={1} editing={isEditing('ownership')} onStartEdit={() => startSectionEdit('ownership')} onSave={saveSectionEdit} onCancel={cancelSectionEdit} />
            <div className="space-y-6">
              {d.owners.map((o, i) => (
                <div key={o.id} className={`space-y-4 ${i > 0 ? 'pt-4 border-t border-dashed border-border/50' : ''}`}>
                  <h4 className="text-sm font-semibold text-foreground">Owner {i + 1}</h4>
                  {isEditing('ownership') ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <EditField label="First Name" path={`owners.${i}.firstName`} />
                        <EditField label="Last Name" path={`owners.${i}.lastName`} />
                        <EditField label="Title" path={`owners.${i}.title`} options={TITLES} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <EditField label="Ownership %" path={`owners.${i}.ownershipPercent`} type="number" />
                        <EditField label="DOB" path={`owners.${i}.dob`} type="date" />
                        <EditField label="SSN" path={`owners.${i}.ssn`} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <EditField label="Email" path={`owners.${i}.email`} />
                        <EditField label="Phone" path={`owners.${i}.phone`} type="tel" />
                      </div>
                      <EditField label="Street Address" path={`owners.${i}.streetAddress`} />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <EditField label="City" path={`owners.${i}.city`} />
                        <EditField label="State" path={`owners.${i}.state`} />
                        <EditField label="ZIP" path={`owners.${i}.zip`} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <ReadOnlyField label="First Name" value={o.firstName} />
                        <ReadOnlyField label="Last Name" value={o.lastName} />
                        <ReadOnlyField label="Title" value={o.title} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <ReadOnlyField label="Ownership %" value={`${o.ownershipPercent}%`} />
                        <ReadOnlyField label="Date of Birth" value={o.dob} />
                        <ReadOnlyField label="SSN" value={o.ssn ? `***-**-${o.ssn.replace(/\D/g, '').slice(-4)}` : '—'} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <ReadOnlyField label="Email" value={o.email} />
                        <ReadOnlyField label="Phone" value={o.phone} />
                      </div>
                      <div>
                        <label className="field-label">Home Address</label>
                        <div className="field-input bg-secondary/50 cursor-default text-foreground mb-3">
                          {o.streetAddress || '—'}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="field-input bg-secondary/50 cursor-default text-foreground">{o.city || '—'}</div>
                          <div className="field-input bg-secondary/50 cursor-default text-foreground">{o.state || '—'}</div>
                          <div className="field-input bg-secondary/50 cursor-default text-foreground">{o.zip || '—'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'banking' && (
          <section>
            <SectionHeader title="Banking & Settlement" sectionNumber={1} editing={isEditing('banking')} onStartEdit={() => startSectionEdit('banking')} onSave={saveSectionEdit} onCancel={cancelSectionEdit} />
            {isEditing('banking') ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <EditField label="Bank Name" path="banking.bankName" />
                  <EditField label="Account Type" path="banking.accountType" options={['checking', 'savings']} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <EditField label="Routing #" path="banking.routingNumber" />
                  <EditField label="Account #" path="banking.accountNumber" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReadOnlyField label="Bank Name" value={bk.bankName} />
                  <ReadOnlyField label="Account Type" value={bk.accountType} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReadOnlyField label="Routing Number" value={bk.routingNumber} />
                  <ReadOnlyField label="Account Number" value={bk.accountNumber ? `****${bk.accountNumber.slice(-4)}` : '—'} />
                </div>
                <div>
                  <label className="field-label">Voided Check or Bank Letter</label>
                  {bk.voidedCheckFile ? (
                    <div className="w-32 mt-1">
                      <DocThumbnail file={bk.voidedCheckFile} />
                    </div>
                  ) : (
                    <div className="field-input bg-secondary/50 cursor-default text-muted-foreground">Not uploaded</div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'documents' && (
          <section>
            <SectionHeader title="Supporting Documents" sectionNumber={1} editing={false} onStartEdit={() => {}} onSave={() => {}} onCancel={() => {}} />
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Driver's License / Government ID</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Front</label>
                    {docs.driversLicenseFront ? (
                      <DocThumbnail file={docs.driversLicenseFront} />
                    ) : (
                      <ReadOnlyField label="" value="Not uploaded" />
                    )}
                  </div>
                  <div>
                    <label className="field-label">Back</label>
                    {docs.driversLicenseBack ? (
                      <DocThumbnail file={docs.driversLicenseBack} />
                    ) : (
                      <ReadOnlyField label="" value="Not uploaded" />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Bank Statements</h4>
                {(docs.bankStatements || []).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(docs.bankStatements || []).map((f: File, i: number) => (
                      <div key={i}>
                        <label className="field-label">Statement {i + 1}</label>
                        <DocThumbnail file={f} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="field-input bg-secondary/50 cursor-default text-muted-foreground">No statements uploaded</div>
                )}
              </div>

              {/* Signature */}
              <div className="border-t border-border/40 pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Electronic Signature</h4>
                {selected?.signature ? (
                  <div className="border border-border rounded-lg p-3 bg-secondary/30 inline-block">
                    <img src={selected.signature} alt="Signature" className="max-h-20" />
                  </div>
                ) : (
                  <div className="field-input bg-secondary/50 cursor-default text-muted-foreground">No signature on file</div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'activity' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Activity Trail</h3>
            </div>
            <div className="">
              <ActivityTrail
                events={getActivityLog(selected!.id)}
                onAddNote={(note) => {
                  addActivityEvent(selected!.id, 'note', 'Note added', note);
                  const freshApps = getApplications();
                  const freshApp = freshApps.find((a) => a.id === selected!.id);
                  if (freshApp) setSelected(freshApp);
                  refresh();
                }}
                onResend={handleResend}
              />
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Applications</h1>
              <p className="text-xs text-muted-foreground">{apps.length} total applications</p>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="field-input pl-10"
              placeholder="Search by name, company, email, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Filters:</span>
            </div>
            <select
              className="field-input !w-auto text-xs py-1.5 px-3"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pre-qual">Pre-Qualified</option>
              <option value="pre-qual-failed">Not Qualified</option>
              <option value="in-progress">In Progress</option>
              <option value="submitted">Submitted</option>
            </select>
            <select
              className="field-input !w-auto text-xs py-1.5 px-3"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="all">All Providers</option>
              {uniqueProviders.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {(statusFilter !== 'all' || providerFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setProviderFilter('all'); }}
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="wizard-card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <SortHeader label="Company" field="company" />
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Contact</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Provider</th>
                <SortHeader label="Volume" field="volume" className="hidden md:table-cell" />
                <SortHeader label="Status" field="status" />
                <SortHeader label="Date" field="date" className="hidden lg:table-cell" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                    {apps.length === 0 ? 'No applications yet.' : 'No matching applications.'}
                  </td>
                </tr>
              ) : (
                filtered.map((app) => {
                  const p = app.data.preQualification.principals[0];
                  const st = STATUS_LABELS[app.status] || STATUS_LABELS['pre-qual'];
                  return (
                    <tr
                      key={app.id}
                      onClick={() => openApp(app)}
                      className="border-b border-border/50 last:border-0 hover:bg-secondary/20 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{app.data.preQualification.companyName || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{p?.firstName} {p?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{p?.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-foreground">{app.data.preQualification.currentProvider || '—'}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-foreground">
                          {app.data.preQualification.monthlyVolume
                            ? `$${Number(app.data.preQualification.monthlyVolume).toLocaleString()}`
                            : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Detail Panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 h-full bg-card border-l border-border shadow-xl flex flex-col w-full sm:w-[560px] md:w-[640px] lg:w-[780px] min-w-[50%]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-foreground truncate">
                    {selected.data.preQualification.companyName || 'Application'}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_LABELS[selected.status]?.color}`}>
                      {STATUS_LABELS[selected.status]?.label}
                    </span>
                    {selected.confirmationId && (
                      <span className="text-[10px] text-muted-foreground font-mono">{selected.confirmationId}</span>
                    )}
                    {selected.pushHistory && selected.pushHistory.length > 0 && (
                      <>
                        {(() => {
                          const latest = new Map<string, typeof selected.pushHistory[0]>();
                          selected.pushHistory.forEach((r) => latest.set(r.provider, r));
                          return Array.from(latest.values()).map((r) => {
                            const prov = PUSH_PROVIDERS.find((p) => p.id === r.provider);
                            const statusColor =
                              r.status === 'pending' ? 'bg-warning/10 text-warning' :
                              r.status === 'accepted' ? 'bg-accent/10 text-accent' :
                              'bg-destructive/10 text-destructive';
                            return (
                              <span key={r.provider} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                                {prov?.name}: {r.status}
                                {(r.status === 'error' || r.status === 'declined') && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleResend(r.provider); }}
                                    className="ml-0.5 hover:opacity-70"
                                    title="Resend"
                                    disabled={resending === r.provider}
                                  >
                                    <RotateCw className={`w-2.5 h-2.5 ${resending === r.provider ? 'animate-spin' : ''}`} />
                                  </button>
                                )}
                              </span>
                            );
                          });
                        })()}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={() => setPushModalOpen(true)}
                    className="btn-accent text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Push App
                  </button>
                  <button onClick={handleCloseModal} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Tabs - dropdown on mobile, inline on larger */}
              <div className="px-5 py-2 border-b border-border shrink-0">
                {/* Mobile dropdown */}
                <div className="sm:hidden">
                  <select
                    value={activeTab}
                    onChange={(e) => handleTabSwitch(e.target.value)}
                    className="field-input text-xs py-1.5"
                  >
                    {tabs.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                {/* Desktop tabs */}
                <div className="hidden sm:flex gap-1 overflow-x-auto">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTabSwitch(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        activeTab === t.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 px-5 py-4">
                {renderModalContent()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Push App Modal */}
      {selected && (
        <PushAppModal
          open={pushModalOpen}
          onClose={() => setPushModalOpen(false)}
          app={selected}
          onPushComplete={() => {
            refresh();
            // Re-select to get fresh data
            const freshApps = getApplications();
            const freshApp = freshApps.find((a) => a.id === selected.id);
            if (freshApp) setSelected(freshApp);
          }}
        />
      )}


      <AlertDialog open={unsavedDialog !== null} onOpenChange={(open) => !open && setUnsavedDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved edits in this section. Would you like to save before continuing, or discard your changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                saveSectionEdit();
                unsavedDialog?.action();
                setUnsavedDialog(null);
              }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save & Continue
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                cancelSectionEdit();
                unsavedDialog?.action();
                setUnsavedDialog(null);
              }}
            >
              Discard & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApplicationsPage;
