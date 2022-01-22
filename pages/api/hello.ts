// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { base } from "../../lib/node/airtable";

export default function handler(req, res) {
  base("1.21.22")
    .select({
      // Selecting the first 3 records in Grouped By Location:
      maxRecords: 3,
      view: "Grouped By Location",
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function (record) {
          console.log("Retrieved", record.get("Network"));
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          res.status(500).json({});
          return;
        } else {
          res.status(200).json({});
        }
      }
    );
}
