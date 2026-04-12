import { useEffect, useCallback, useRef } from 'react';
import { MerchantApplication } from '@/types/application';

const STORAGE_KEY = 'merchant_app_draft';
const STEP_KEY = 'merchant_app_step';
const QUALIFIED_KEY = 'merchant_app_qualified';

/** Serializes application data, stripping File objects (not serializable). */
const serializeData = (data: MerchantApplication) => {
  return JSON.stringify(data, (key, value) => {
    if (value instanceof File) return { __file: true, name: value.name };
    return value;
  });
};

export const saveDraft = (data: MerchantApplication, step: number, qualified: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, serializeData(data));
    localStorage.setItem(STEP_KEY, String(step));
    localStorage.setItem(QUALIFIED_KEY, String(qualified));
  } catch {
    // quota exceeded — silently fail
  }
};

export const loadDraft = (): { data: MerchantApplication; step: number; qualified: boolean } | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const step = parseInt(localStorage.getItem(STEP_KEY) || '0', 10);
    const qualified = localStorage.getItem(QUALIFIED_KEY) === 'true';
    // Restore File fields as null (can't persist actual files)
    if (data.banking?.voidedCheckFile?.__file) data.banking.voidedCheckFile = null;
    if (data.documents?.driversLicenseFront?.__file) data.documents.driversLicenseFront = null;
    if (data.documents?.driversLicenseBack?.__file) data.documents.driversLicenseBack = null;
    if (data.documents?.bankStatements) {
      data.documents.bankStatements = [];
    }
    return { data, step, qualified };
  } catch {
    return null;
  }
};

export const clearDraft = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STEP_KEY);
  localStorage.removeItem(QUALIFIED_KEY);
};

export const useAutoSave = (data: MerchantApplication, step: number, qualified: boolean) => {
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveDraft(data, step, qualified);
    }, 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data, step, qualified]);

  const manualSave = useCallback(() => {
    saveDraft(data, step, qualified);
  }, [data, step, qualified]);

  return { manualSave };
};
