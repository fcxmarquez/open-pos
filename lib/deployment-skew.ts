/**
 * Detects deployment skew by comparing the build ID baked into the client bundle
 * (NEXT_PUBLIC_BUILD_ID) against the current server build ID. When they differ,
 * the client JS is stale and a full page reload is needed.
 */

const CLIENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? null;

let checkInFlight: Promise<void> | null = null;

async function fetchServerBuildId(): Promise<string | null> {
  try {
    const res = await fetch("/api/build-id", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.buildId === "string" ? data.buildId : null;
  } catch {
    return null;
  }
}

/**
 * Call this when a server action fails. It checks whether the failure is caused
 * by deployment skew (stale client vs new server). If so, it reloads the page.
 *
 * Concurrent callers share the same in-flight check to avoid redundant fetches.
 */
export async function reloadIfDeploymentSkew(): Promise<void> {
  if (checkInFlight) return checkInFlight;
  if (!CLIENT_BUILD_ID) return;

  checkInFlight = (async () => {
    const serverBuildId = await fetchServerBuildId();

    // Could not reach the build-id endpoint — network issue, not skew
    if (!serverBuildId) return;

    // Build IDs match — the error is genuine, not skew
    if (CLIENT_BUILD_ID === serverBuildId) return;

    // Deployment changed — reload to get new client bundles
    window.location.reload();
  })();

  try {
    await checkInFlight;
  } finally {
    checkInFlight = null;
  }
}
