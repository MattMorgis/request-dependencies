const {URL} = require("url");
const request = require("request-promise-native");

const PACKAGE_NAME = "request";

const dependentPackagesByPage = (package, page) => {
  // https://github.com/npm/registry/blob/master/docs/REPLICATE-API.md
  const registry = new URL(
    "/registry/_design/app/_view/dependedUpon",
    "https://skimdb.npmjs.com"
  );

  registry.searchParams.set("group_level", "2");
  registry.searchParams.set("startkey", JSON.stringify([package]));
  registry.searchParams.set("endkey", JSON.stringify([package, {}]));
  registry.searchParams.set("limit", "100");
  registry.searchParams.set("skip", (page * 100).toString());
  registry.searchParams.set("state", "update_after");

  return registry;
};

// https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values
const packageDownloads = package => {
  return new URL(
    "/downloads/point/last-month/" + package,
    "https://api.npmjs.org"
  );
};

async function* getDependentPackagesByBatches(package, batches = 1000) {
  // [0, 1, 2, 3 ... pageLimit] slice (remove 0) -> [1, 2, 3, ... pageLimit]
  const numberOfPagesToFetch = [...new Array(batches + 1).keys()].slice(1);
  for (const page of numberOfPagesToFetch) {
    try {
      const packages = await request(dependentPackagesByPage(package, page), {
        json: true
      });
      const packageNames = packages.rows.map(item => item.key[1]);
      yield packageNames;
    } catch (e) {
      throw e;
    }
  }
}

async function* getPackageFromBatch(batch) {
  for await (const packages of batch) {
    for (const package of packages) {
      yield package;
    }
  }
}

async function* getDownloadsForPackage(pkg) {
  for await (const package of pkg) {
    try {
      const downloadStats = await request(packageDownloads(package), {
        json: true
      });
      yield downloadStats;
    } catch (e) {
      throw e;
    }
  }
}

const log = async lines => {
  for await (const line of lines) {
    console.log(line);
  }
};

const main = async () => {
  try {
    log(
      getDownloadsForPackage(
        getPackageFromBatch(getDependentPackagesByBatches(PACKAGE_NAME, 500))
      )
    );
  } catch (e) {
    console.log(e.message);
    process.exit(-1);
  }
};

main();
