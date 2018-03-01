var request = require('superagent');
var Promise = require("bluebird");

var GHUtil = require("./GHUtil");
var ghUtil = new GHUtil();

GraphHopperMapMatching = function (args) {
    this.host = "https://graphhopper.com/api/1";
    this.vehicle = "car";
    this.gps_accuracy = 20;
    this.max_visited_nodes = 3000;
    this.debug = false;
    this.data_type = 'json';
    this.locale = 'en';
    this.points_encoded = true;
    this.instructions = true;
    this.elevation = true;
    this.basePath = '/match';
    this.timeout = 100000;

    ghUtil.copyProperties(args, this);
};

GraphHopperMapMatching.prototype.getParametersAsQueryString = function (args) {
    var qString = "locale=" + args.locale;

    if (args.debug)
        qString += "&debug=true";

    qString += "&gps_accuracy=" + args.gps_accuracy;
    qString += "&max_visited_nodes=" + args.max_visited_nodes;
    qString += "&type=" + args.data_type;

    if (args.instructions)
        qString += "&instructions=" + args.instructions;

    if (args.points_encoded)
        qString += "&points_encoded=" + args.points_encoded;

    if (args.elevation)
        qString += "&elevation=" + args.elevation;

    if (args.vehicle)
        qString += "&vehicle=" + args.vehicle;

    return qString;
};

GraphHopperMapMatching.prototype.doRequest = function (content, reqArgs) {
    var that = this;

    return new Promise(function (resolve, reject) {
        var args = ghUtil.clone(that);
        if (reqArgs)
            args = ghUtil.copyProperties(reqArgs, args);

        var url = args.host + args.basePath + "?" + that.getParametersAsQueryString(args);
        if (args.key)
            url += "&key=" + args.key;

        request
            .post(url)
            .send(content)
            .accept('application/json')
            .type('application/xml')
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

                                // for now delete this
                                delete path.snapped_waypoints;
                            }
                        }
                    }
                    resolve(res.body);
                }
            });
    });
};

module.exports = GraphHopperMapMatching;