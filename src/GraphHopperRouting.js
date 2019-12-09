var request = require('superagent');
var Promise = require("bluebird");

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
    this.skip = {"skip": true, "host": true, "basePath": true, "graphhopper_maps_host": true, "turn_sign_map": true, "timeout": true, "data_type": true};

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

GraphHopperRouting.prototype.getParametersAsQueryString = function (args, skipParameters) {
    var queryString = "";
    for (var key in args) {
        if (skipParameters && skipParameters[key])
            continue;

        var val = args[key];

        if (key === 'points')
            queryString += this.createPointParams(val);
        else
            queryString += this.flatParameter(key, val);
    }
    return queryString;
};

GraphHopperRouting.prototype.createPointParams = function (points) {
    if (!ghUtil.isArray(points)) {
        return "";
    }

    var str = "", point, i, l;

    for (i = 0, l = points.length; i < l; i++) {
        point = points[i];
        if (i > 0)
            str += "&";
        if (point.lat)
            str += "point=" + encodeURIComponent(point.lat + "," + point.lng);
        else if (ghUtil.isArray(point) && point.length === 2)
            str += "point=" + encodeURIComponent(point[1] + "," + point[0]);
        else
            str += "point=" + encodeURIComponent(point.toString());
    }
    return (str);
};

GraphHopperRouting.prototype.flatParameter = function (key, val) {
    var url = "";
    var arr;
    var keyIndex;

    if (ghUtil.isObject(val)) {
        arr = Object.keys(val);
        for (keyIndex in arr) {
            var objKey = arr[keyIndex];
            url += this.flatParameter(key + "." + objKey, val[objKey]);
        }
        return url;

    } else if (ghUtil.isArray(val)) {
        arr = val;
        for (keyIndex in arr) {
            url += this.flatParameter(key, arr[keyIndex]);
        }
        return url;
    }

    return "&" + encodeURIComponent(key) + "=" + encodeURIComponent(val);
};


/**
 * Execute the routing request using the provided args.
 *
 * Points have to be an array. Each point can be in one of these forms:
 * - "lat,lng"
 * - [lng, lat]
 * - {lat: lat, lng: lng}
 * - GHInput (e.g. new GHInput("52.303545,13.207455"))
 *
 * @param   reqArgs can be either a string, object, or null.
 *          If you pass a string, it should be in the form of "point=x&parameterA=b&key=abc" and the parameters and values
 *          should be encoded using <code>encodeURIComponent()</code>.
 */
GraphHopperRouting.prototype.doRequest = function (reqArgs) {
    var that = this;

    return new Promise(function (resolve, reject) {
        var args = ghUtil.clone(that);
        var url = args.host + args.basePath + "?";

        if (reqArgs) {
            if (ghUtil.isObject(reqArgs)) {
                args = ghUtil.copyProperties(reqArgs, args);
                url += that.getParametersAsQueryString(args, that.skip);
            } else if (ghUtil.isString(reqArgs)) {
                url += reqArgs;
            } else {
                reject(new Error("The reqArgs have to be either String, an Object, or null"));
            }
        } else {
            // Use the default args
            url += that.getParametersAsQueryString(args, that.skip);
        }

        request
            .get(url)
            .accept(args.data_type)
            .timeout(args.timeout)
            .end(function (err, res) {
                if (err || !res.ok) {
                    reject(ghUtil.extractError(res, url));
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
                            if (path.instructions) {
                                for (var j = 0; j < path.instructions.length; j++) {
                                    // Add a LngLat to every instruction
                                    var interval = path.instructions[j].interval;
                                    // The second parameter of slice is non inclusive, therefore we have to add +1
                                    path.instructions[j].points = path.points.coordinates.slice([interval[0], interval[1] + 1]);
                                }
                            }
                        }
                    }
                    resolve(res.body);
                }
            });
    });
};

GraphHopperRouting.prototype.info = function (reqArgs) {
    var that = this;

    return new Promise(function (resolve, reject) {
        var args = ghUtil.clone(that);
        if (reqArgs)
            args = ghUtil.copyProperties(reqArgs, args);

        var url = args.host + "/info?" + "key=" + args.key;

        request
            .get(url)
            .accept(args.data_type)
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

GraphHopperRouting.prototype.i18n = function (reqArgs) {
    var that = this;

    return new Promise(function (resolve, reject) {
        var args = ghUtil.clone(that);
        if (reqArgs)
            args = ghUtil.copyProperties(reqArgs, args);

        var url = args.host + "/i18n/" + args.locale + "?" + "key=" + args.key;

        request
            .get(url)
            .accept(args.data_type)
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

GraphHopperRouting.prototype.getGraphHopperMapsLink = function () {
    return this.graphhopper_maps_host + this.getParametersAsQueryString(this);
};

GraphHopperRouting.prototype.getTurnText = function (sign) {
    return this.turn_sign_map[sign];
};

module.exports = GraphHopperRouting;