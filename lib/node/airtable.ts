import { airtableConfig } from "./config";
import Airtable from "airtable";

Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: airtableConfig.apiKey,
});

export const base = Airtable.base(airtableConfig.baseId);
