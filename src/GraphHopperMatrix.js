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

GraphHopperMatrix.prototype.toHtmlTable = function (to_points, from_points, doubleArray) {
    let htmlOut = "<table border='1' cellpadding='10'>";

    // header => to points
    htmlOut += "<tr>";

    // upper left corner:
    htmlOut += "<td>&#8595; from &#92; to &#8594;</td>";

    // header with to points
    for (let idxTo in this.to_points) {
        htmlOut += "<td><b>" + this.to_points[idxTo] + "</b></td>";
    }
    htmlOut += "</tr>";

    for (let idxFrom in doubleArray) {
        htmlOut += "<tr>";
        htmlOut += "<td><b>" + this.from_points[idxFrom] + "</b></td>";
        let res = doubleArray[idxFrom];
        for (let idxTo in res) {
            let mapsURL = "https://graphhopper.com/maps?"
                + "point=" + encodeURIComponent(this.from_points[idxFrom])
                + "&point=" + encodeURIComponent(this.to_points[idxTo])
                + "&vehicle=" + this.vehicle;

            htmlOut += "<td> <a href='" + mapsURL + "'>" + res[idxTo] + "</a> </td>";
        }
        htmlOut += "</tr>\n";
    }
    htmlOut += "</table>";
    return htmlOut;
};

module.exports = GraphHopperMatrix;