import { StoredApplication, MerchantApplication } from '@/types/application';

const STORE_KEY = 'merchant_applications';

export const getApplications = (): StoredApplication[] => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
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
  localStorage.setItem(STORE_KEY, JSON.stringify(apps));
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
