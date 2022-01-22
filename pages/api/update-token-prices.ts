// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { base, tables } from "../../lib/node/airtable";
import { cmk } from "../../lib/node/cmk";
import { coinGecko } from "../../lib/node/coingecko";
const { pipe, map, uniq, flatten, filter } = require("ramda");

export default async function updateTokenPrices(req, res) {
  const { fields, view, table } = tables.currentPortfolio;

  const recordsToPriceSync = await base(table)
    .select({
      view,
      filterByFormula: `{${fields.priceSyncCheckbox}} = 1`,
    })
    .all();

  // as we sync the CMK prices we'll fill in this checklist
  // so we can fall back to coin gecko for the coins that we weren't
  // able to sync
  const priceSyncdRowIds = {};

  const symbolsToGetCmkPricesFor = pipe(
    map((r) => r.get(fields.cmkSymbol)),
    filter((s) => !!s),
    uniq
  )(recordsToPriceSync);

  // Note: we COULD use a single API call here by passing an array of symbols,
  // but then if one token is invalid we wont get any of the other replys, so
  // we make a separate request for each token
  const cmkReplys = await Promise.all(
    symbolsToGetCmkPricesFor.map((token) => cmk.getQuotes({ symbol: token }))
  );

  const recordUpdatePromises = [];
  for (const reply of cmkReplys) {
    const { data } = reply;
    if (!data) {
      continue;
    }
    const token = Object.keys(data)[0];
    if (!token) {
      continue;
    }

    const active = reply.data?.[token]?.is_active;
    if (!active) {
      continue;
    }

    const quote = reply.data?.[token]?.quote.USD;
    if (!quote) {
      continue;
    }
    const { price, last_updated } = quote;
    const records = recordsToPriceSync.filter(
      (r) => r.get(fields.cmkSymbol) === token
    );
    for (const record of records) {
      priceSyncdRowIds[record.id] = true;
      const p = base(table).update(record.id, {
        [fields.tokenPrice]: price,
        [fields.tokenPriceTimestamp]: last_updated,
      });
      recordUpdatePromises.push(p);
    }
  }

  const coinIdsToGetCoinGeckoPricesFor = pipe(
    filter((r) => !priceSyncdRowIds[r.id] && !!r.get(fields.coinGeckoId)),
    map((r) => r.get(fields.coinGeckoId)),
    uniq
  )(recordsToPriceSync);

  const coinGeckoReplys = await Promise.all(
    coinIdsToGetCoinGeckoPricesFor.map((id) => coinGecko.coins.fetch(id, {}))
  );

  for (const reply of coinGeckoReplys) {
    if (!reply.success) {
      continue;
    }
    const price = reply?.data?.market_data?.current_price?.usd;
    if (price === undefined) {
      continue;
    }
    const lastUpdated = reply.data.last_updated;
    const id = reply.data.id;
    const records = recordsToPriceSync.filter(
      (r) => !priceSyncdRowIds[r.id] && r.get(fields.coinGeckoId) === id
    );
    for (const record of records) {
      priceSyncdRowIds[record.id] = true;
      const p = base(table).update(record.id, {
        [fields.tokenPrice]: price,
        [fields.tokenPriceTimestamp]: lastUpdated,
      });
      recordUpdatePromises.push(p);
    }
  }

  await Promise.all(recordUpdatePromises);

  res.status(202).json({});
}
