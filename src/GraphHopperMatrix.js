var request = require('superagent');
var Promise = require("bluebird");

var GHUtil = require("./GHUtil");
var ghUtil = new GHUtil();

GraphHopperMatrix = function (args) {
    this.host = "https://graphhopper.com/api/1";
    this.vehicle = "car";
    this.debug = false;
    this.from_points = [];
    this.to_points = [];
    this.out_arrays = [];
    this.basePath = "/matrix";
    this.graphhopper_maps_host = "https://graphhopper.com/maps/?";
    this.timeout = 30000;

    ghUtil.copyProperties(args, this);
};

GraphHopperMatrix.prototype.addPoint = function (latlon) {
    this.addFromPoint(latlon);
    this.addToPoint(latlon);
};

GraphHopperMatrix.prototype.addFromPoint = function (latlon) {
    this.from_points.push(latlon);
};

GraphHopperMatrix.prototype.addToPoint = function (latlon) {
    this.to_points.push(latlon);
};

GraphHopperMatrix.prototype.clearPoints = function () {
    this.from_points.length = 0;
    this.to_points.length = 0;
};

GraphHopperMatrix.prototype.addOutArray = function (type) {
    this.out_arrays.push(type);
};

GraphHopperMatrix.prototype.doRequest = function (reqArgs) {
    var that = this;
    return new Promise(function (resolve, reject) {
        var args = ghUtil.clone(that);
        if (reqArgs)
            args = ghUtil.copyProperties(reqArgs, args);

        var url = args.host + args.basePath + "?vehicle=" + args.vehicle + "&key=" + args.key;

        for (var idx in args.from_points) {
            var p = args.from_points[idx];
            url += "&from_point=" + encodeURIComponent(p.toString());
        }
        for (var idx in args.to_points) {
            var p = args.to_points[idx];
            url += "&to_point=" + encodeURIComponent(p.toString());
        }

        if (args.out_arrays) {
            for (var idx in args.out_arrays) {
                var type = args.out_arrays[idx];
                url += "&out_array=" + type;
            }
        }

        if (args.debug)
            url += "&debug=true";

        request
            .get(url)
            .accept('application/json')
            .timeout(args.timeout)
            .end(function (err, res) {
                if (err || !res.ok) {
                    reject(ghUtil.extractError(res, url));
                } else if (res) {
                    resolve(res.body);
                }
            });
    });
};

GraphHopperMatrix.prototype.toHtmlTable = function (doubleArray) {
    var htmlOut = "<table border='1' cellpadding='10'>";

    // header => to points
    htmlOut += "<tr>";

    // upper left corner:
    htmlOut += "<td>&#8595; from &#92; to &#8594;</td>";

    // header with to points
    for (var idxTo in this.to_points) {
        htmlOut += "<td><b>" + this.to_points[idxTo] + "</b></td>";
    }
    htmlOut += "</tr>";

    for (var idxFrom in doubleArray) {
        htmlOut += "<tr>";
        htmlOut += "<td><b>" + this.from_points[idxFrom] + "</b></td>";
        var res = doubleArray[idxFrom];
        for (var idxTo in res) {
            var mapsURL = this.graphhopper_maps_host
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