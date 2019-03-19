"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var meow_1 = __importDefault(require("meow"));
var readline_1 = __importDefault(require("readline"));
var csv_parse_1 = __importDefault(require("csv-parse"));
var circleToPolygon = require("circle-to-polygon");
/**
 * Help text
 */
var help = "\ncsv2geojson\n\nConverts csv to geojson\n\nUsage\n\n  $ cat csvfile.csv | csv2geojson > geojsonfile.json\n\nOptions\n  --lat : Sets the latitude field\n  --lon : Sets the longitude field\n  --sides : Sets the number of sides for each polygon\n\n";
/**
 * Parsed cli object
 */
var cli = meow_1.default(help, {
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
var sides = parseInt(cli.flags.sides || "4", 10);
var lat = cli.flags.lat || "LAT";
var lon = cli.flags.lon || "LON";
var rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
var data = "";
rl.on("line", function (line) {
    data += line + "\n";
});
rl.on("close", function () {
    csv_parse_1.default(data, {}, function (err, output) {
        if (!err) {
            if (output.length) {
                var rawHeader_1 = output.shift();
                if (rawHeader_1) {
                    var headers = rawHeader_1.reduce(function (acc, next, i) {
                        acc[next] = i;
                        return acc;
                    }, {});
                    var root = {
                        type: "FeatureCollection",
                        name: "Export_" + new Date().getTime(),
                        crs: {
                            type: "name",
                            properties: {
                                name: "urn:ogc:def:crs:OGC:1.3:CRS84"
                            }
                        },
                        features: []
                    };
                    root.features = output
                        .map(function (item) {
                        var itemData = item.reduce(function (acc, next, i) {
                            var fieldName = rawHeader_1[i];
                            if (next) {
                                if (fieldName === lat) {
                                    acc.lat = parseFloat(next);
                                }
                                else if (fieldName === lon) {
                                    acc.lon = parseFloat(next);
                                }
                                else {
                                    acc.keys[fieldName] = next;
                                }
                            }
                            return acc;
                        }, {
                            keys: {},
                            lat: undefined,
                            lon: undefined
                        });
                        if (itemData.lat && itemData.lon) {
                            var geometry = circleToPolygon([itemData.lon, itemData.lat], 100, sides);
                            // console.log(itemData);
                            // console.log(JSON.stringify(geometry, null, 2));
                            return {
                                type: "Feature",
                                properties: itemData.keys,
                                geometry: geometry
                            };
                        }
                        else {
                            return undefined;
                        }
                    })
                        .filter(function (i) { return i; });
                    console.log(JSON.stringify(root, null, 2));
                }
            }
        }
    });
});
