import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";

initializeApp();

const SERVICE_ACCOUNT =
  "knead-to-know-fn@kneadtoknow-c4913.iam.gserviceaccount.com";

setGlobalOptions({
  maxInstances: 10,
  serviceAccount: SERVICE_ACCOUNT,
  // Require App Check — rejects requests not from the real app
  enforceAppCheck: true,
});

const db = getFirestore();
const secrets = new SecretManagerServiceClient();

// ─── Helpers ───

function getProjectId(): string {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  if (!projectId) {
    throw new HttpsError("internal", "Could not determine GCP project ID.");
  }
  return projectId;
}

async function storeSecret(uid: string, token: string): Promise<void> {
  const projectId = getProjectId();
  const secretId = `ha-token-${uid}`;
  const parent = `projects/${projectId}`;
  const secretName = `${parent}/secrets/${secretId}`;

  try {
    await secrets.getSecret({name: secretName});
    // Secret exists — add a new version
    await secrets.addSecretVersion({
      parent: secretName,
      payload: {data: Buffer.from(token, "utf8")},
    });
  } catch (err: unknown) {
    const grpcErr = err as {code?: number};
    if (grpcErr.code === 5) {
      // NOT_FOUND — create the secret, then add first version
      await secrets.createSecret({
        parent,
        secretId,
        secret: {replication: {automatic: {}}},
      });
      await secrets.addSecretVersion({
        parent: secretName,
        payload: {data: Buffer.from(token, "utf8")},
      });
    } else {
      throw err;
    }
  }
}

async function getSecret(uid: string): Promise<string> {
  const projectId = getProjectId();
  const secretName =
    `projects/${projectId}/secrets/ha-token-${uid}/versions/latest`;

  const [version] = await secrets.accessSecretVersion({name: secretName});
  const payload = version.payload?.data;
  if (!payload) {
    throw new HttpsError(
      "not-found",
      "No Home Assistant token found. Go to Settings to connect."
    );
  }
  return typeof payload === "string"
    ? payload
    : Buffer.from(payload).toString("utf8");
}

async function fetchHAState(
  url: string,
  token: string,
  entityId: string
): Promise<{tempF: number; sensorName: string; unit: string}> {
  const response = await fetch(`${url}/api/states/${entityId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new HttpsError("unauthenticated", "Invalid Home Assistant token.");
    }
    if (response.status === 404) {
      throw new HttpsError(
        "not-found",
        `Sensor "${entityId}" not found in Home Assistant.`
      );
    }
    throw new HttpsError(
      "unavailable",
      `Home Assistant returned HTTP ${response.status}.`
    );
  }

  const data = await response.json();
  let tempF = parseFloat(data.state);
  if (isNaN(tempF)) {
    throw new HttpsError(
      "failed-precondition",
      `Sensor returned invalid value: "${data.state}"`
    );
  }

  const unit = data.attributes?.unit_of_measurement || "";
  if (unit === "°C" || unit === "C") {
    tempF = Math.round((tempF * 9 / 5 + 32) * 10) / 10;
  }

  const sensorName = data.attributes?.friendly_name || entityId;
  return {tempF, sensorName, unit};
}

// ─── Cloud Functions ───

/**
 * Save Home Assistant configuration.
 * Tests the connection first, stores the token in Secret Manager,
 * and saves non-sensitive config (url, entityId) in Firestore.
 */
export const saveHAConfig = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const uid = request.auth.uid;
  const {url, token, entityId} = request.data as {
    url: string;
    token: string;
    entityId: string;
  };

  if (!url || !token || !entityId) {
    throw new HttpsError(
      "invalid-argument",
      "url, token, and entityId are required."
    );
  }

  // Test the connection before saving anything
  await fetchHAState(url, token, entityId);

  // Store token in Secret Manager (encrypted at rest)
  await storeSecret(uid, token);

  // Store non-sensitive config in Firestore
  await db.doc(`users/${uid}/config/homeAssistant`).set({
    url,
    entityId,
    updatedAt: new Date(),
  });

  return {success: true};
});

/**
 * Get temperature from the user's Home Assistant instance.
 * Reads the token from Secret Manager and config from Firestore.
 */
export const getTemperatureFromHA = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const uid = request.auth.uid;

  // Read non-sensitive config from Firestore
  const configDoc = await db.doc(`users/${uid}/config/homeAssistant`).get();
  if (!configDoc.exists) {
    throw new HttpsError(
      "not-found",
      "Home Assistant not configured. Go to Settings to connect."
    );
  }

  const {url, entityId} = configDoc.data() as {url: string; entityId: string};

  // Read token from Secret Manager
  const token = await getSecret(uid);

  // Fetch and return temperature
  return await fetchHAState(url, token, entityId);
});
