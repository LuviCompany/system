"use server";

import { requireSession } from "@/server/auth/session";
import { testGooglePlacesConnection, type TestConnectionResult } from "@/server/lead-sourcing/google-places/test-connection";

export async function testGooglePlacesConnectionAction(): Promise<TestConnectionResult> {
  await requireSession();
  return testGooglePlacesConnection();
}
