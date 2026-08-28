import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  Opportunity, 
  ClientOrganization, 
  ResourceMember, 
  FormSelectorsConfig, 
  StageDefinition 
} from '../types';
import { INITIAL_OPPORTUNITIES } from '../data/mockOpportunities';
import { INITIAL_CLIENTS } from '../data/mockClients';
import { INITIAL_RESOURCES } from '../data/mockResources';
import { INITIAL_FORM_SELECTORS } from '../data/mockFormSelectors';
import { WORKFLOW_STAGES } from '../data/stages';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Collection References
export const OPP_COLLECTION = 'opportunities';
export const CLIENT_COLLECTION = 'clients';
export const RESOURCE_COLLECTION = 'resources';
export const CONFIG_COLLECTION = 'appConfig';

/**
 * Recursively removes all undefined properties from an object before Firestore write.
 * Firestore strictly throws an error if any field in an object or nested map is undefined.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => (item === undefined ? null : sanitizeForFirestore(item))) as any;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result as T;
}

/**
 * Seeds initial mock data into Firestore if collections are empty.
 */
export async function seedInitialFirestoreDataIfEmpty(): Promise<boolean> {
  try {
    const oppSnapshot = await getDocs(collection(db, OPP_COLLECTION));
    if (oppSnapshot.empty) {
      console.log('⚡ Initializing Firestore Database with default seed data...');
      const batch = writeBatch(db);

      // Seed Opportunities
      INITIAL_OPPORTUNITIES.forEach((opp) => {
        const oppRef = doc(db, OPP_COLLECTION, opp.id);
        batch.set(oppRef, sanitizeForFirestore(opp));
      });

      // Seed Clients
      INITIAL_CLIENTS.forEach((client) => {
        const clientRef = doc(db, CLIENT_COLLECTION, client.id);
        batch.set(clientRef, sanitizeForFirestore(client));
      });

      // Seed Resources
      INITIAL_RESOURCES.forEach((res) => {
        const resRef = doc(db, RESOURCE_COLLECTION, res.id);
        batch.set(resRef, sanitizeForFirestore(res));
      });

      // Seed Configs
      const formRef = doc(db, CONFIG_COLLECTION, 'formSelectors');
      batch.set(formRef, { data: sanitizeForFirestore(INITIAL_FORM_SELECTORS) });

      const stagesRef = doc(db, CONFIG_COLLECTION, 'stageDefinitions');
      batch.set(stagesRef, { data: sanitizeForFirestore(WORKFLOW_STAGES) });

      await batch.commit();
      console.log('✅ Firestore Database seed completed successfully.');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error seeding initial Firestore data:', error);
    return false;
  }
}

/**
 * Subscribe to real-time opportunities from Firestore.
 */
export function subscribeOpportunities(
  onData: (opps: Opportunity[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, OPP_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Opportunity[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Opportunity);
      });
      // Sort by updatedAt descending (fallback to createdAt)
      list.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      });
      onData(list);
    },
    (err) => {
      console.error('Firestore opportunities subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update an Opportunity in Firestore.
 */
export async function saveOpportunityToDb(opportunity: Opportunity): Promise<void> {
  const oppRef = doc(db, OPP_COLLECTION, opportunity.id);
  const cleanData = sanitizeForFirestore({
    ...opportunity,
    updatedAt: new Date().toISOString()
  });
  await setDoc(oppRef, cleanData, { merge: true });
}

/**
 * Delete an Opportunity from Firestore.
 */
export async function deleteOpportunityFromDb(oppId: string): Promise<void> {
  const oppRef = doc(db, OPP_COLLECTION, oppId);
  await deleteDoc(oppRef);
}

/**
 * Subscribe to real-time clients from Firestore.
 */
export function subscribeClients(
  onData: (clients: ClientOrganization[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, CLIENT_COLLECTION),
    (snapshot) => {
      const list: ClientOrganization[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ClientOrganization);
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      onData(list);
    },
    (err) => {
      console.error('Firestore clients subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a Client Organization in Firestore.
 */
export async function saveClientToDb(client: ClientOrganization): Promise<void> {
  const clientRef = doc(db, CLIENT_COLLECTION, client.id);
  await setDoc(clientRef, sanitizeForFirestore(client), { merge: true });
}

/**
 * Delete a Client Organization from Firestore.
 */
export async function deleteClientFromDb(clientId: string): Promise<void> {
  const clientRef = doc(db, CLIENT_COLLECTION, clientId);
  await deleteDoc(clientRef);
}

/**
 * Subscribe to real-time resources from Firestore.
 */
export function subscribeResources(
  onData: (resources: ResourceMember[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, RESOURCE_COLLECTION),
    (snapshot) => {
      const list: ResourceMember[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ResourceMember);
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      onData(list);
    },
    (err) => {
      console.error('Firestore resources subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a Resource Member in Firestore.
 */
export async function saveResourceToDb(resource: ResourceMember): Promise<void> {
  const resRef = doc(db, RESOURCE_COLLECTION, resource.id);
  await setDoc(resRef, sanitizeForFirestore(resource), { merge: true });
}

/**
 * Delete a Resource Member from Firestore.
 */
export async function deleteResourceFromDb(resourceId: string): Promise<void> {
  const resRef = doc(db, RESOURCE_COLLECTION, resourceId);
  await deleteDoc(resRef);
}

/**
 * Subscribe to Form Selectors config from Firestore.
 */
export function subscribeFormSelectors(
  onData: (config: FormSelectorsConfig) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, CONFIG_COLLECTION, 'formSelectors');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists() && docSnap.data()?.data) {
        onData(docSnap.data()?.data as FormSelectorsConfig);
      }
    },
    (err) => {
      console.error('Firestore formSelectors subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save Form Selectors config to Firestore.
 */
export async function saveFormSelectorsToDb(config: FormSelectorsConfig): Promise<void> {
  const docRef = doc(db, CONFIG_COLLECTION, 'formSelectors');
  await setDoc(docRef, { data: sanitizeForFirestore(config) }, { merge: true });
}

/**
 * Subscribe to Stage SLA definitions from Firestore.
 */
export function subscribeStageDefinitions(
  onData: (stages: StageDefinition[]) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, CONFIG_COLLECTION, 'stageDefinitions');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists() && docSnap.data()?.data) {
        onData(docSnap.data()?.data as StageDefinition[]);
      }
    },
    (err) => {
      console.error('Firestore stageDefinitions subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save Stage SLA definitions to Firestore.
 */
export async function saveStageDefinitionsToDb(stages: StageDefinition[]): Promise<void> {
  const docRef = doc(db, CONFIG_COLLECTION, 'stageDefinitions');
  await setDoc(docRef, { data: sanitizeForFirestore(stages) }, { merge: true });
}

/**
 * Resets Firestore database to default demo dataset.
 */
export async function resetFirestoreToDemoData(): Promise<void> {
  try {
    const oppDocs = await getDocs(collection(db, OPP_COLLECTION));
    const clientDocs = await getDocs(collection(db, CLIENT_COLLECTION));
    const resDocs = await getDocs(collection(db, RESOURCE_COLLECTION));

    const batch = writeBatch(db);
    oppDocs.forEach((d) => batch.delete(d.ref));
    clientDocs.forEach((d) => batch.delete(d.ref));
    resDocs.forEach((d) => batch.delete(d.ref));

    INITIAL_OPPORTUNITIES.forEach((opp) => {
      batch.set(doc(db, OPP_COLLECTION, opp.id), sanitizeForFirestore(opp));
    });
    INITIAL_CLIENTS.forEach((c) => {
      batch.set(doc(db, CLIENT_COLLECTION, c.id), sanitizeForFirestore(c));
    });
    INITIAL_RESOURCES.forEach((r) => {
      batch.set(doc(db, RESOURCE_COLLECTION, r.id), sanitizeForFirestore(r));
    });
    batch.set(doc(db, CONFIG_COLLECTION, 'formSelectors'), { data: sanitizeForFirestore(INITIAL_FORM_SELECTORS) });
    batch.set(doc(db, CONFIG_COLLECTION, 'stageDefinitions'), { data: sanitizeForFirestore(WORKFLOW_STAGES) });

    await batch.commit();
    console.log('✅ Firestore Database reset to initial demo dataset.');
  } catch (error) {
    console.error('Error resetting Firestore database:', error);
    throw error;
  }
}

