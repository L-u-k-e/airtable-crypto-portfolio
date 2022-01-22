import { airtableConfig } from "./config";
import Airtable from "airtable";

Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: airtableConfig.apiKey,
});

export const base = Airtable.base(airtableConfig.baseId);

export const tables = {
  deposits: {
    table: "External Deposits",
    view: "Deposits",
    fields: {
      value: "Value",
    },
  },
  currentPortfolio: {
    table: "Portfolio",
    view: "Raw Data",
    fields: {
      value: "Value",
      priceSyncCheckbox: "Sync Price",
      cmkSymbol: "CMK Symbol",
      tokenPrice: "Token Price",
      tokenPriceTimestamp: "Price Timestamp",
      coinGeckoId: "CoinGecko ID",
    },
  },
};
