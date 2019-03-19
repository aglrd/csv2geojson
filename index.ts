import meow from "meow";
import readline from "readline";
import parse from "csv-parse";
import circleToPolygon = require("circle-to-polygon");

/**
 * Help text
 */
const help = `
csv2geojson

Converts csv to geojson

Usage

  $ cat csvfile.csv | csv2geojson > geojsonfile.json

Options
  --lat : Sets the latitude field
  --lon : Sets the longitude field
  --sides : Sets the number of sides for each polygon

`;

/**
 * Parsed cli object
 */
const cli = meow(help, {
  flags: {
    lat: {
      type: "string"
    },
    lon: {
      type: "string"
    },
    sides: {
      type: "string"
    }
  }
});

const sides = parseInt(cli.flags.sides || "4", 10);
const lat = cli.flags.lat || "LAT";
const lon = cli.flags.lon || "LON";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let data = "";

rl.on("line", line => {
  data += line + "\n";
});

rl.on("close", () => {
  parse(data, {}, (err, output: string[][]) => {
    if (!err) {
      if (output.length) {
        const rawHeader = output.shift();
        if (rawHeader) {
          const headers = rawHeader.reduce(
            (acc: { [name: string]: number }, next: string, i: number) => {
              acc[next] = i;
              return acc;
            },
            {} as ({ [name: string]: number })
          );
          const root = {
            type: "FeatureCollection",
            name: "Export_" + new Date().getTime(),
            crs: {
              type: "name",
              properties: {
                name: "urn:ogc:def:crs:OGC:1.3:CRS84"
              }
            },
            features: [] as any[]
          };
          root.features = output
            .map(item => {
              const itemData = item.reduce(
                (acc, next, i) => {
                  const fieldName = rawHeader[i];
                  if (next) {
                    if (fieldName === lat) {
                      acc.lat = parseFloat(next);
                    } else if (fieldName === lon) {
                      acc.lon = parseFloat(next);
                    } else {
                      acc.keys[fieldName] = next;
                    }
                  }
                  return acc;
                },
                {
                  keys: {},
                  lat: undefined,
                  lon: undefined
                } as {
                  keys: { [name: string]: string | number };
                  lat?: number;
                  lon?: number;
                }
              );
              if (itemData.lat && itemData.lon) {
                const geometry = circleToPolygon(
                  [itemData.lon, itemData.lat],
                  100,
                  sides
                );
                // console.log(itemData);
                // console.log(JSON.stringify(geometry, null, 2));
                return {
                  type: "Feature",
                  properties: itemData.keys,
                  geometry
                };
              } else {
                return undefined;
              }
            })
            .filter(i => i);
          console.log(JSON.stringify(root, null, 2));
        }
      }
    }
  });
});
