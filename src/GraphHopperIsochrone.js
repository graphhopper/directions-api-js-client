var request = require('superagent');
var Promise = require("bluebird");

var GHUtil = require("./GHUtil");
var ghUtil = new GHUtil();

GraphHopperIsochrone = function (args) {
    this.time_limit = 600;
    this.distance_limit = 0;
    this.buckets = 3;
    this.vehicle = "car";
    this.point;
    this.host = "https://graphhopper.com/api/1";
    this.debug = false;
    this.basePath = '/isochrone';
    this.timeout = 30000;
    this.reverse_flow = false;

    ghUtil.copyProperties(args, this);
};

GraphHopperIsochrone.prototype.getParametersAsQueryString = function (args) {
    var qString = "point=" + args.point;
    qString += "&time_limit=" + args.time_limit;
    qString += "&distance_limit=" + args.distance_limit;
    qString += "&buckets=" + args.buckets;
    qString += "&vehicle=" + args.vehicle;
    qString += "&reverse_flow=" + args.reverse_flow;

    if (args.debug)
        qString += "&debug=true";

    return qString;
};

GraphHopperIsochrone.prototype.doRequest = function (reqArgs) {
    var that = this;

    return new Promise(function(resolve, reject) {
        var args = ghUtil.clone(that);
        if (reqArgs)
            args = ghUtil.copyProperties(reqArgs, args);

        var url = args.host + args.basePath + "?" + that.getParametersAsQueryString(args) + "&key=" + args.key;

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

module.exports = GraphHopperIsochrone;