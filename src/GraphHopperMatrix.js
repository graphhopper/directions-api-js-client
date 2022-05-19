let request = require('axios');

let GHUtil = require("./GHUtil");
let ghUtil = new GHUtil();

GraphHopperMatrix = function (args, requestDefaults) {
    this.defaults = {
        profile: "car",
        debug: false,
        out_arrays: ["times"],

    }
    if (requestDefaults)
        Object.keys(requestDefaults).forEach(key => {
            this.defaults[key] = requestDefaults[key];
        });

    this.key = args.key;
    this.host = args.host ? args.host : "https://graphhopper.com/api/1";
    this.endpoint = args.endpoint ? args.endpoint : '/matrix';
    this.timeout = args.timeout ? args.timeout : 30000;
};

GraphHopperMatrix.prototype.doRequest = function (reqArgs) {
    Object.keys(this.defaults).forEach(key => {
        if (!reqArgs[key]) reqArgs[key] = this.defaults[key];
    });

    if (!reqArgs.from_points && !reqArgs.to_points) {
        reqArgs.from_points = reqArgs.points;
        reqArgs.to_points = reqArgs.points;
        delete reqArgs["points"];
    }

    let url = this.host + this.endpoint + "?key=" + this.key;
    let that = this;

    return new Promise(function (resolve, reject) {
        request.post(url, reqArgs, {
            timeout: that.timeout,
            headers: {'Content-Type': 'application/json'}
        })
            .then(res => {
                if (res.status !== 200) {
                    reject(ghUtil.extractError(res, url));
                } else if (res) {
                    resolve(res.data);
                }
            })
            .catch(err => {
                reject(ghUtil.extractError(err.response, url));
            });
    });
};

GraphHopperMatrix.prototype.toHtmlTable = function (request, doubleArray) {
    let to_points = request.to_points, from_points = request.from_points;
    let htmlOut = "<table border='1' cellpadding='10'>";

    // header => to points
    htmlOut += "<tr>";

    // upper left corner:
    htmlOut += "<td>&#8595; from &#92; to &#8594;</td>";

    // header with to points
    for (let idxTo in to_points) {
        htmlOut += "<td><b>" + to_points[idxTo][1] + "," + to_points[idxTo][0] + "</b></td>";
    }
    htmlOut += "</tr>";

    for (let idxFrom in doubleArray) {
        htmlOut += "<tr>";
        htmlOut += "<td><b>" + from_points[idxFrom][1] + "," + from_points[idxFrom][0] + "</b></td>";
        let res = doubleArray[idxFrom];
        for (let idxTo in res) {
            let mapsURL = "https://graphhopper.com/maps?"
                + "point=" + encodeURIComponent(from_points[idxFrom][1] + "," + from_points[idxFrom][0])
                + "&point=" + encodeURIComponent(to_points[idxTo][1] + "," + to_points[idxTo][0])
                + "&profile=" + request.profile;

            htmlOut += "<td> <a href='" + mapsURL + "'>" + res[idxTo] + "</a> </td>";
        }
        htmlOut += "</tr>\n";
    }
    htmlOut += "</table>";
    return htmlOut;
};

module.exports = GraphHopperMatrix;