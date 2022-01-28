import Head from "next/head";
import currency from "currency.js";
import { base, tables } from "../lib/node/airtable";
const { reduceBy, sort, descend, map } = require("ramda");

export async function getServerSideProps() {
  const { fields, view, table } = tables.currentPortfolio;
  const records = await base(table)
    .select({ view, filterByFormula: `${fields.value} >= 0` })
    .all();
  const sumReducer = (acc, record) => acc + record.get(fields.value);
  const tokenValues = reduceBy(
    sumReducer,
    0,
    (record) => record.get(fields.tokenGroup),
    records
  );
  const totalValue = records.reduce(sumReducer, 0);
  const percentages = map((tokenSum) => (tokenSum / totalValue) * 100)(
    tokenValues
  );
  return {
    props: {
      percentages,
      values: tokenValues,
    },
  };
}

export default function PortfolioAllocation({ percentages, values }) {
  const tokensSortedByPercentDesc = sort(
    descend((token) => percentages[token])
  )(Object.keys(percentages));
  return (
    <div>
      <Head>
        <title>Airtable Crypto Portfolio</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <a
          style={{ color: "blue", textDecoration: "underline", margin: 15 }}
          href="https://airtable.com/app7aGG2CqYq8oS62/tblozF5PZFhQe9Pyw/viwUo0LC12jGarQAv?blocks=hide"
        >
          Airtable Base
        </a>
        <table cellSpacing={15}>
          <thead>
            <tr>
              <th>Token&emsp;</th>
              <th>Value (USD)</th>
              <th>Percent</th>
            </tr>
          </thead>
          <tbody>
            {tokensSortedByPercentDesc.map((token) => (
              <tr key={token}>
                <td>{token}&emsp;</td>
                <td>{`${currency(values[token]).format(true)}`}</td>
                <td>{percentages[token].toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
