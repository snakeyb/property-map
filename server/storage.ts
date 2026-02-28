import type { Property, PropertiesResponse } from "@shared/schema";

const ESPOCRM_BASE_URL = "https://pf.wspp.co.uk/api/v1/CUnits";
const MAX_SIZE = 200;
const isProduction = process.env.NODE_ENV === "production";

export interface IStorage {
  fetchProperties(forceRefresh?: boolean): Promise<PropertiesResponse>;
}

interface EspoCRMRecord {
  id: string;
  name?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  receptionRooms?: number;
  parking?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressCountry?: string;
  addressPostalCode?: string;
  latitude?: number;
  longitude?: number;
  listingUrl?: string;
  status?: string;
  [key: string]: any;
}

function transformRecord(record: EspoCRMRecord): Property {
  return {
    id: record.id,
    name: record.name || null,
    type: record.propertyType || null,
    bedrooms: typeof record.bedrooms === "number" ? record.bedrooms : null,
    bathrooms: typeof record.bathrooms === "number" ? record.bathrooms : null,
    receptionRooms: typeof record.receptionRooms === "number" ? record.receptionRooms : null,
    parking: record.parking || null,
    addressStreet: record.addressStreet || null,
    addressCity: record.addressCity || null,
    addressState: record.addressState || null,
    addressCountry: record.addressCountry || null,
    addressPostalCode: record.addressPostalCode || null,
    latitude: typeof record.latitude === "number" ? record.latitude : (typeof record.latitude === "string" ? parseFloat(record.latitude) || null : null),
    longitude: typeof record.longitude === "number" ? record.longitude : (typeof record.longitude === "string" ? parseFloat(record.longitude) || null : null),
    listingUrl: record.listingURL || record.listingUrl || null,
    status: record.status || null,
  };
}

export class MemStorage implements IStorage {
  private cachedProperties: Property[] = [];
  private lastFetched: string | null = null;
  private fetchPromise: Promise<PropertiesResponse> | null = null;

  async fetchProperties(forceRefresh = false): Promise<PropertiesResponse> {
    if (!forceRefresh && this.cachedProperties.length > 0 && this.lastFetched) {
      return {
        properties: this.cachedProperties,
        total: this.cachedProperties.length,
        lastFetched: this.lastFetched,
      };
    }

    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = this.fetchAllFromAPI();
    try {
      const result = await this.fetchPromise;
      return result;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async fetchAllFromAPI(): Promise<PropertiesResponse> {
    const allRecords: Property[] = [];
    let offset = 0;
    let hasMore = true;

    if (!isProduction) console.log("Starting to fetch properties from EspoCRM...");

    while (hasMore) {
      const url = `${ESPOCRM_BASE_URL}?maxSize=${MAX_SIZE}&offset=${offset}&orderBy=name&order=asc`;
      if (!isProduction) console.log(`Fetching offset=${offset}...`);

      try {
        const apiKey = process.env.ESPOCRM_API_KEY;
        const headers: Record<string, string> = {
          "Accept": "application/json",
        };
        if (apiKey) {
          headers["X-Api-Key"] = apiKey;
        }
        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(`EspoCRM API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const records: EspoCRMRecord[] = data.list || [];
        const total = data.total || 0;

        const transformed = records.map(transformRecord);
        allRecords.push(...transformed);

        if (!isProduction) console.log(`Fetched ${records.length} records (total so far: ${allRecords.length}/${total})`);

        if (records.length < MAX_SIZE || allRecords.length >= total) {
          hasMore = false;
        } else {
          offset += MAX_SIZE;
        }
      } catch (error) {
        console.error(`Error fetching at offset ${offset}:`, error);
        if (allRecords.length > 0) {
          hasMore = false;
        } else {
          throw error;
        }
      }
    }

    this.cachedProperties = allRecords;
    this.lastFetched = new Date().toISOString();

    if (!isProduction) console.log(`Total properties fetched: ${allRecords.length}`);

    return {
      properties: this.cachedProperties,
      total: this.cachedProperties.length,
      lastFetched: this.lastFetched,
    };
  }
}

export const storage = new MemStorage();
