import { getPlaceDetails } from "./details";
import { searchTextPlaces } from "./search";
import type { ProviderBusiness, SearchProvider, SearchProviderParams } from "../types";

async function searchBusinesses(params: SearchProviderParams): Promise<ProviderBusiness[]> {
  return searchTextPlaces(params);
}

async function getBusinessDetails(externalId: string): Promise<Partial<ProviderBusiness> | null> {
  return getPlaceDetails(externalId);
}

export const googlePlacesProvider: SearchProvider = {
  id: "google_places",
  label: "Google Places",
  searchBusinesses,
  getBusinessDetails,
};
