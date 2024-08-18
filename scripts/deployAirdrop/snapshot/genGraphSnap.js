// genGraphSnap.js

// 1
import fs from "fs";
import { GET_AIRDROP } from "../../../test/airdrop/utils/NOC/graphReactNOC.mjs";
import client from "../../../test/airdrop/utils/NOC/urqlClientNOC.mjs";

const snapshotFilePath = "./scripts/deployAirdrop/snapshot/snapshot.json";

async function fetchAndSaveSnapshot() {
  const projects = await getSubgraph();

  if (!projects) {
    console.error("No data available to save snapshot");
    return;
  }

  // Save the fetched data to a JSON file
  fs.writeFileSync(snapshotFilePath, JSON.stringify(projects, null, 2));
  console.log(`Snapshot saved to ${snapshotFilePath}`);
}

fetchAndSaveSnapshot();

async function getSubgraph() {
  try {
    const result = await client.query(GET_AIRDROP).toPromise();
    const { data, fetching, error } = result;

    if (fetching) {
      console.log("Fetching...");
    }

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    return data.projects;
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}
