import { cmkConfig } from "./config";
import Cmk from "coinmarketcap-api";

export const cmk = new Cmk(cmkConfig.apiKey);
