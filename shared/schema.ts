import { z } from "zod";

export const propertySchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  receptionRooms: z.number().nullable().optional(),
  parking: z.string().nullable().optional(),
  addressStreet: z.string().nullable().optional(),
  addressCity: z.string().nullable().optional(),
  addressState: z.string().nullable().optional(),
  addressCountry: z.string().nullable().optional(),
  addressPostalCode: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  listingUrl: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

export type Property = z.infer<typeof propertySchema>;

export const propertiesResponseSchema = z.object({
  properties: z.array(propertySchema),
  total: z.number(),
  lastFetched: z.string(),
});

export type PropertiesResponse = z.infer<typeof propertiesResponseSchema>;

export const filterSchema = z.object({
  bedroomsMin: z.number().min(0).default(0),
  bedroomsMax: z.number().min(0).default(10),
  bathroomsMin: z.number().min(0).default(0),
  bathroomsMax: z.number().min(0).default(10),
  receptionRoomsMin: z.number().min(0).default(0),
  receptionRoomsMax: z.number().min(0).default(10),
  parkingTypes: z.array(z.string()).default([]),
  propertyTypes: z.array(z.string()).default([]),
});

export type PropertyFilter = z.infer<typeof filterSchema>;
