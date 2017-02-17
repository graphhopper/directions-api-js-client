var request = require('superagent');

var GHUtil = require("./GHUtil");
var ghUtil = new GHUtil();

GraphHopperIsochrone = function (args) {
    this.time_limit = 600;
    this.buckets = 3;
    this.vehicle = "car";
    this.point;
    this.host = "https://graphhopper.com/api/1";
    this.debug = false;
    this.basePath = '/isochrone';
    this.timeout = 5000;

    ghUtil.copyProperties(args, this);
};

GraphHopperIsochrone.prototype.getParametersAsQueryString = function (args) {
    var qString = "point=" + args.point;
    qString += "&time_limit=" + args.time_limit;
    qString += "&buckets=" + args.buckets;
    qString += "&vehicle=" + args.vehicle;

    if (args.debug)
        qString += "&debug=true";

    return qString;
};

GraphHopperIsochrone.prototype.doRequest = function (callback, reqArgs) {
    var that = this;
    var args = ghUtil.clone(that);
    if (reqArgs)
        args = ghUtil.copyProperties(reqArgs, args);

    var url = args.host + args.basePath + "?" + this.getParametersAsQueryString(args) + "&key=" + args.key;

    request
        .get(url)
        .accept('application/json')
        .timeout(args.timeout)
        .end(function (err, res) {
            if (err || !res.ok) {
                callback(ghUtil.extractError(res, url));
            } else if (res) {
                callback(res.body);
            }
        });
};

module.exports = GraphHopperIsochrone;