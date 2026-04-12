import { StoredApplication, ActivityEvent, ActivityEventType, PushRecord, PushProviderId } from '@/types/application';
import { getApplications, saveApplication } from './applicationsStore';

/** Add an activity event to an application */
export const addActivityEvent = (
  appId: string,
  type: ActivityEventType,
  title: string,
  detail?: string,
  provider?: string,
  meta?: Record<string, unknown>,
): ActivityEvent => {
  const apps = getApplications();
  const app = apps.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  const event: ActivityEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    title,
    detail,
    provider,
    meta,
  };

  if (!app.activityLog) app.activityLog = [];
  app.activityLog.push(event);
  saveApplication(app);
  return event;
};

/** Simulate pushing an application to a provider */
export const pushApplication = async (
  appId: string,
  providerId: PushProviderId,
  providerName: string,
): Promise<PushRecord> => {
  const apps = getApplications();
  const app = apps.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  // Log the push attempt
  addActivityEvent(appId, 'pushed', `Application pushed to ${providerName}`, undefined, providerId);

  // Simulate API call
  await new Promise((r) => setTimeout(r, 2000));

  // Mock response
  const success = Math.random() > 0.15; // 85% success rate
  const record: PushRecord = {
    id: crypto.randomUUID(),
    provider: providerId,
    pushedAt: new Date().toISOString(),
    status: success ? 'pending' : 'error',
    externalRef: success ? `${providerId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}` : undefined,
    responseMessage: success
      ? 'Application received and is under review.'
      : 'Connection timeout. Please retry.',
  };

  // Re-read app to get latest (after activity event was added)
  const freshApps = getApplications();
  const freshApp = freshApps.find((a) => a.id === appId)!;
  if (!freshApp.pushHistory) freshApp.pushHistory = [];
  freshApp.pushHistory.push(record);
  saveApplication(freshApp);

  // Log the response
  addActivityEvent(
    appId,
    success ? 'push_response' : 'push_error',
    success ? `${providerName} acknowledged receipt` : `Push to ${providerName} failed`,
    record.responseMessage,
    providerId,
    { externalRef: record.externalRef },
  );

  return record;
};

/** Get activity log for an application, newest first */
export const getActivityLog = (appId: string): ActivityEvent[] => {
  const apps = getApplications();
  const app = apps.find((a) => a.id === appId);
  return (app?.activityLog || []).slice().reverse();
};
