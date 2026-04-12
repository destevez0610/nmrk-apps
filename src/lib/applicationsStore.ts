import { StoredApplication, MerchantApplication } from '@/types/application';

const STORE_KEY = 'merchant_applications';

/** Strip File objects (not JSON-serializable) before persisting. */
const sanitizeForStorage = (_key: string, value: unknown) => {
  if (value instanceof File) return null;
  return value;
};

/** Restore nullified file fields after JSON parse. */
const sanitizeAfterLoad = (app: StoredApplication): StoredApplication => {
  const d = app.data;
  if (d.banking) {
    if (d.banking.voidedCheckFile && !(d.banking.voidedCheckFile instanceof File)) {
      d.banking.voidedCheckFile = null;
    }
  }
  if (d.documents) {
    if (d.documents.driversLicenseFront && !(d.documents.driversLicenseFront instanceof File)) {
      d.documents.driversLicenseFront = null;
    }
    if (d.documents.driversLicenseBack && !(d.documents.driversLicenseBack instanceof File)) {
      d.documents.driversLicenseBack = null;
    }
    if (d.documents.bankStatements) {
      d.documents.bankStatements = d.documents.bankStatements.filter(
        (f: unknown) => f instanceof File
      );
    }
  }
  return app;
};

export const getApplications = (): StoredApplication[] => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as StoredApplication[]).map(sanitizeAfterLoad);
  } catch {
    return [];
  }
};

export const saveApplication = (app: StoredApplication) => {
  const apps = getApplications();
  const idx = apps.findIndex((a) => a.id === app.id);
  if (idx >= 0) {
    apps[idx] = { ...app, updatedAt: new Date().toISOString() };
  } else {
    apps.push(app);
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(apps, sanitizeForStorage));
};

export const createApplication = (
  data: MerchantApplication,
  status: StoredApplication['status'],
  confirmationId?: string,
  failReason?: string,
): StoredApplication => {
  const app: StoredApplication = {
    id: crypto.randomUUID(),
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data,
    confirmationId,
    failReason,
  };
  saveApplication(app);
  return app;
};

export const updateApplicationData = (id: string, data: Partial<StoredApplication>) => {
  const apps = getApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx >= 0) {
    apps[idx] = { ...apps[idx], ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORE_KEY, JSON.stringify(apps));
  }
};

export const deleteApplication = (id: string) => {
  const apps = getApplications().filter((a) => a.id !== id);
  localStorage.setItem(STORE_KEY, JSON.stringify(apps));
};
