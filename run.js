const fs = require("fs");
const {URL} = require("url");
const {map} = require("arrasync");
const got = require("got");

const PACKAGE_NAME = "request";

https://github.com/npm/registry/blob/master/docs/REPLICATE-API.md#overview
const dependentPackagesByPage = (package, page) => {
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
const packageDownloadsURL = package => {
  return new URL(
    "/downloads/point/last-month/" + package,
    "https://api.npmjs.org"
  );
};

async function* getDependentPackagesByBatches(package, batches = 1000) {
  // [0, 1, 2, 3 ... pageLimit] slice (remove 0) -> [1, 2, 3, ... pageLimit]
  const numberOfPagesToFetch = [...new Array(batches + 1).keys()].slice(1);
  for (const page of numberOfPagesToFetch) {
    process.stdout.write("requesting batch " + page + " of " + batches + "\r");
    process.stdout.write("\n");
    //console.log("requesting batch " + page + " of " + batches);
    try {
      const packages = await got(dependentPackagesByPage(package, page), {
        json: true
      });
      if (packages.body.rows.length === 0) {
        process.stdout.write("Finished processing all dependecies");
        process.stdout.write("\n");
        process.exit(1);
      }
      yield packages.body.rows;
    } catch (e) {
      throw e;
    }
  }
}

async function* getPackageDownloads(batches) {
  for await (const packages of batches) {
    const packageDownloads = await map(packages, async p => {
      try {
        process.stdout.write(
          "requesting downloads for package " + p.key[1] + "\r"
        );

        const downloadStats = await got(packageDownloadsURL(p.key[1]), {
          json: true
        });
        const {downloads, package} = downloadStats.body;
        return {downloads, package};
      } catch (e) {
        if (e.statusCode === 404) {
          return null;
        }
        throw e;
      }
    });
    process.stdout.write("\n");
    yield packageDownloads.filter(e => e !== null);
  }
}

const writeCSV = async batch => {
  const fileStream = fs.createWriteStream(__dirname + "/results.csv");
  try {
    fileStream.write(`"package","downloads"`);
    fileStream.write("\n");
    for await (const packages of batch) {
      for (package of packages) {
        if (
          (package.package !== undefined || package.downloads !== undefined) &&
          package.downloads > 100
        ) {
          fileStream.write(`"${package.package}"`);
          fileStream.write(",");
          fileStream.write(package.downloads.toString());
          fileStream.write("\n");
        }
      }
    }
  } catch (e) {
    throw e;
  }
};

const main = async () => {
  try {
    writeCSV(
      getPackageDownloads(getDependentPackagesByBatches(PACKAGE_NAME, 1000))
    );
  } catch (e) {
    console.log(e.message);
    process.exit(-1);
  }
};

main();
