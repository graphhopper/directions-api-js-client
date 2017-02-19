var request = require('superagent');

var GHUtil = require("./GHUtil");
var ghUtil = new GHUtil();

GraphHopperRouting = function (args) {
    this.points = [];
    this.host = "https://graphhopper.com/api/1";
    this.vehicle = "car";
    this.debug = false;
    this.data_type = 'application/json';
    this.locale = 'en';
    this.points_encoded = true;
    this.instructions = true;
    this.elevation = false;
    this.optimize = 'false';
    this.basePath = '/route';
    this.timeout = 10000;

// TODO make reading of /api/1/info/ possible
//    this.elevation = false;
//    var featureSet = this.features[this.vehicle];
//    if (featureSet && featureSet.elevation) {
//        if ('elevation' in params)
//            this.elevation = params.elevation;
//        else
//            this.elevation = true;
//    }

    this.graphhopper_maps_host = "https://graphhopper.com/maps/?";
    // TODO use the i18n text provided by api/1/i18n in over 25 languages
    this.turn_sign_map = {
        "-6": "leave roundabout",
        "-3": "turn sharp left",
        "-2": "turn left",
        "-1": "turn slight left",
        0: "continue",
        1: "turn slight right",
        2: "turn right",
        3: "turn sharp right",
        4: "finish",
        5: "reached via point",
        6: "enter roundabout"
    };

    ghUtil.copyProperties(args, this);
};

GraphHopperRouting.prototype.clearPoints = function () {
    this.points.length = 0;
};

GraphHopperRouting.prototype.addPoint = function (latlon) {
    this.points.push(latlon);
};

GraphHopperRouting.prototype.getParametersAsQueryString = function (args) {
    var qString = "locale=" + args.locale;

    for (var idx in args.points) {
        var p = args.points[idx];
        qString += "&point=" + encodeURIComponent(p.toString());
    }

    if (args.debug)
        qString += "&debug=true";

    qString += "&type=" + args.data_type;

    if (args.instructions)
        qString += "&instructions=" + args.instructions;

    if (args.points_encoded)
        qString += "&points_encoded=" + args.points_encoded;

    if (args.elevation)
        qString += "&elevation=" + args.elevation;

    if (args.optimize)
        qString += "&optimize=" + args.optimize;

    if (args.vehicle)
        qString += "&vehicle=" + args.vehicle;

    return qString;
};

GraphHopperRouting.prototype.doRequest = function (callback, reqArgs) {
    var that = this;
    var args = ghUtil.clone(that);
    if (reqArgs)
        args = ghUtil.copyProperties(reqArgs, args);

    var url = args.host + args.basePath + "?" + that.getParametersAsQueryString(args) + "&key=" + args.key;

    request
        .get(url)
        .accept(args.data_type)
        .timeout(args.timeout)
        .end(function (err, res) {
            if (err || !res.ok) {
                callback(ghUtil.extractError(res, url));
            } else if (res) {
                if (res.body.paths) {
                    for (var i = 0; i < res.body.paths.length; i++) {
                        var path = res.body.paths[i];
                        // convert encoded polyline to geo json
                        if (path.points_encoded) {
                            var tmpArray = ghUtil.decodePath(path.points, that.elevation);
                            path.points = {
                                "type": "LineString",
                                "coordinates": tmpArray
                            };

                            var tmpSnappedArray = ghUtil.decodePath(path.snapped_waypoints, that.elevation);
                            path.snapped_waypoints = {
                                "type": "LineString",
                                "coordinates": tmpSnappedArray
                            };
                        }
                    }
                }
                callback(res.body);
            }
        });
};

GraphHopperRouting.prototype.getGraphHopperMapsLink = function () {
    return this.graphhopper_maps_host + this.getParametersAsQueryString(this);
};

GraphHopperRouting.prototype.getTurnText = function (sign) {
    return this.turn_sign_map[sign];
};

module.exports = GraphHopperRouting;