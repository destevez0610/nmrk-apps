import { useState, useEffect, useCallback, useMemo } from 'react';
import { StoredApplication, MerchantApplication, CURRENT_PROVIDERS } from '@/types/application';
import { getApplications, saveApplication } from '@/lib/applicationsStore';
import { formatPhone } from '@/lib/formatPhone';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Eye, Pencil, Check, ArrowLeft,
  Building2, Users, CreditCard, Landmark, FileText,
  ArrowUpDown, Filter,
} from 'lucide-react';

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

const ApplicationsPage = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<StoredApplication[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StoredApplication | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<MerchantApplication | null>(null);
  const [activeTab, setActiveTab] = useState('preQual');

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
    setEditing(false);
    setEditData(JSON.parse(JSON.stringify(app.data)));
    setActiveTab('preQual');
  };

  const startEdit = () => {
    setEditing(true);
    setEditData(JSON.parse(JSON.stringify(selected!.data)));
  };

  const saveEdit = () => {
    if (!selected || !editData) return;
    const updated = { ...selected, data: editData };
    saveApplication(updated);
    setSelected(updated);
    setEditing(false);
    refresh();
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditData(JSON.parse(JSON.stringify(selected!.data)));
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
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  const Field = ({ label, value }: { label: string; value: string | number | undefined | null }) => (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );

  const EditField = ({ label, path, type = 'text', options }: { label: string; path: string; type?: string; options?: string[] }) => {
    const keys = path.split('.');
    let val: any = editData;
    for (const k of keys) val = val?.[k];

    if (options) {
      return (
        <div className="space-y-1">
          <label className="field-label">{label}</label>
          <select className="field-input" value={val || ''} onChange={(e) => updateField(path, e.target.value)}>
            <option value="">Select...</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }

    return (
      <div className="space-y-1">
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
    const d = editing ? editData! : selected.data;
    const pq = d.preQualification;
    const bp = d.businessProfile;
    const pp = d.processingProfile;
    const bk = d.banking;

    return (
      <div className="space-y-4">
        {activeTab === 'preQual' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Pre-Qualification Details</h3>
            {editing ? (
              <div className="space-y-3">
                <EditField label="Company Name" path="preQualification.companyName" />
                <EditField label="Location" path="preQualification.location" options={['US', 'Canada', 'International']} />
                <EditField label="Monthly Volume" path="preQualification.monthlyVolume" type="number" />
                <EditField label="Average Ticket" path="preQualification.averageTicket" type="number" />
                <EditField label="Current Provider" path="preQualification.currentProvider" options={CURRENT_PROVIDERS} />
              </div>
            ) : (
              <>
                <Field label="Company" value={pq.companyName} />
                <Field label="Location" value={pq.location} />
                <Field label="Monthly Volume" value={pq.monthlyVolume ? `$${Number(pq.monthlyVolume).toLocaleString()}` : ''} />
                <Field label="Average Ticket" value={pq.averageTicket ? `$${Number(pq.averageTicket).toLocaleString()}` : ''} />
                <Field label="Current Provider" value={pq.currentProvider} />
                <Field label="Stripe Kickoff" value={pq.wasKickedOffStripe === true ? 'Yes' : pq.wasKickedOffStripe === false ? 'No' : '—'} />
                <Field label="Bank Account" value={pq.hasBusinessBankAccount === true ? 'Yes' : pq.hasBusinessBankAccount === false ? 'No' : '—'} />
              </>
            )}
            <h4 className="text-sm font-semibold text-foreground mt-4">Principals</h4>
            {pq.principals.map((p, i) => (
              <div key={p.id} className="p-3 rounded-lg border border-border space-y-1">
                <p className="text-xs font-semibold text-foreground">{i === 0 ? 'Primary' : `Principal ${i + 1}`}</p>
                {editing ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <EditField label="First Name" path={`preQualification.principals.${i}.firstName`} />
                      <EditField label="Last Name" path={`preQualification.principals.${i}.lastName`} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <EditField label="Email" path={`preQualification.principals.${i}.email`} />
                      <EditField label="Phone" path={`preQualification.principals.${i}.phone`} type="tel" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <EditField label="Title" path={`preQualification.principals.${i}.title`} options={TITLES} />
                      <EditField label="Ownership %" path={`preQualification.principals.${i}.ownershipPercent`} type="number" />
                    </div>
                  </div>
                ) : (
                  <>
                    <Field label="Name" value={`${p.firstName} ${p.lastName}`} />
                    <Field label="Email" value={p.email} />
                    <Field label="Phone" value={p.phone} />
                    <Field label="Title" value={p.title} />
                    <Field label="Ownership" value={`${p.ownershipPercent}%`} />
                  </>
                )}
              </div>
            ))}
            {selected.failReason && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive font-medium">Fail Reason: {selected.failReason}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'business' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Business Profile</h3>
            {editing ? (
              <div className="space-y-3">
                <EditField label="Legal Name" path="businessProfile.legalName" />
                <EditField label="DBA" path="businessProfile.dba" />
                <EditField label="Structure" path="businessProfile.businessStructure" />
                <EditField label="Industry" path="businessProfile.industryType" />
                <EditField label="Street Address" path="businessProfile.streetAddress" />
                <div className="grid grid-cols-3 gap-2">
                  <EditField label="City" path="businessProfile.city" />
                  <EditField label="State" path="businessProfile.state" />
                  <EditField label="ZIP" path="businessProfile.zip" />
                </div>
                <EditField label="Phone" path="businessProfile.phoneNumber" type="tel" />
                <EditField label="Website" path="businessProfile.websiteUrl" />
              </div>
            ) : (
              <>
                <Field label="Legal Name" value={bp.legalName} />
                <Field label="DBA" value={bp.dba} />
                <Field label="Structure" value={bp.businessStructure} />
                <Field label="Industry" value={bp.industryType} />
                <Field label="Address" value={bp.streetAddress ? `${bp.streetAddress}, ${bp.city}, ${bp.state} ${bp.zip}` : ''} />
                <Field label="Phone" value={bp.phoneNumber} />
                <Field label="Website" value={bp.websiteUrl} />
              </>
            )}
          </div>
        )}

        {activeTab === 'processing' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Processing Profile</h3>
            {editing ? (
              <div className="space-y-3">
                <EditField label="Monthly Volume" path="processingProfile.monthlyVolume" type="number" />
                <EditField label="Avg Ticket" path="processingProfile.averageTicket" type="number" />
                <EditField label="High Ticket" path="processingProfile.highTicket" type="number" />
                <EditField label="Card Present %" path="processingProfile.cardPresentPercent" type="number" />
                <EditField label="Card Not Present %" path="processingProfile.cardNotPresentPercent" type="number" />
                <EditField label="Refund Policy URL" path="processingProfile.refundPolicyUrl" />
              </div>
            ) : (
              <>
                <Field label="Monthly Volume" value={pp.monthlyVolume ? `$${Number(pp.monthlyVolume).toLocaleString()}` : ''} />
                <Field label="Avg Ticket" value={pp.averageTicket ? `$${Number(pp.averageTicket).toLocaleString()}` : ''} />
                <Field label="High Ticket" value={pp.highTicket ? `$${Number(pp.highTicket).toLocaleString()}` : ''} />
                <Field label="Card Present" value={`${pp.cardPresentPercent}%`} />
                <Field label="Card Not Present" value={`${pp.cardNotPresentPercent}%`} />
                {pp.refundPolicyUrl && <Field label="Refund Policy" value={pp.refundPolicyUrl} />}
              </>
            )}
          </div>
        )}

        {activeTab === 'ownership' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Ownership & Principals</h3>
            {d.owners.map((o, i) => (
              <div key={o.id} className="p-3 rounded-lg border border-border">
                {editing ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <EditField label="First Name" path={`owners.${i}.firstName`} />
                      <EditField label="Last Name" path={`owners.${i}.lastName`} />
                    </div>
                    <EditField label="Title" path={`owners.${i}.title`} options={TITLES} />
                    <EditField label="Ownership %" path={`owners.${i}.ownershipPercent`} type="number" />
                    <EditField label="Email" path={`owners.${i}.email`} />
                    <EditField label="Phone" path={`owners.${i}.phone`} type="tel" />
                  </div>
                ) : (
                  <>
                    <Field label={`Owner ${i + 1}`} value={`${o.firstName} ${o.lastName}`} />
                    <Field label="Title" value={o.title} />
                    <Field label="Ownership" value={`${o.ownershipPercent}%`} />
                    <Field label="Email" value={o.email} />
                    <Field label="Phone" value={o.phone} />
                    <Field label="Address" value={o.streetAddress ? `${o.streetAddress}, ${o.city}, ${o.state} ${o.zip}` : ''} />
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'banking' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Banking & Settlement</h3>
            {editing ? (
              <div className="space-y-3">
                <EditField label="Bank Name" path="banking.bankName" />
                <EditField label="Routing #" path="banking.routingNumber" />
                <EditField label="Account #" path="banking.accountNumber" />
                <EditField label="Account Type" path="banking.accountType" options={['checking', 'savings']} />
              </div>
            ) : (
              <>
                <Field label="Bank" value={bk.bankName} />
                <Field label="Account Type" value={bk.accountType} />
                <Field label="Routing #" value={bk.routingNumber} />
                <Field label="Account #" value={bk.accountNumber ? `****${bk.accountNumber.slice(-4)}` : ''} />
              </>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Documents</h3>
            <Field label="ID Front" value={d.documents.driversLicenseFront ? 'Uploaded' : 'Not uploaded'} />
            <Field label="ID Back" value={d.documents.driversLicenseBack ? 'Uploaded' : 'Not uploaded'} />
            <Field label="Bank Statements" value={`${d.documents.bankStatements.length} file(s)`} />
          </div>
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

      {/* Application Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-xl border border-border shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {selected.data.preQualification.companyName || 'Application'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_LABELS[selected.status]?.color}`}>
                      {STATUS_LABELS[selected.status]?.label}
                    </span>
                    {selected.confirmationId && (
                      <span className="text-xs text-muted-foreground font-mono">{selected.confirmationId}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <button onClick={cancelEdit} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                      <button onClick={saveEdit} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                    </>
                  ) : (
                    <button onClick={startEdit} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-6 py-2 border-b border-border overflow-x-auto shrink-0">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
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

              {/* Content */}
              <div className="overflow-y-auto flex-1 px-6 py-4">
                {renderModalContent()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApplicationsPage;
