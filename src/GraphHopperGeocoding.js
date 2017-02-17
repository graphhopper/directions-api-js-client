var request = require('superagent');

var GHUtil = require("./GHUtil");
var ghUtil = new GHUtil();

GraphHopperGeocoding = function (args) {
    // prefer results from a certain location (type: GHInput)
    this.location_bias;
    // the query
    this.query;
    this.host = "https://graphhopper.com/api/1";
    this.debug = false;
    this.locale = "en";
    this.basePath = '/geocode';
    this.timeout = 5000;

    ghUtil.copyProperties(args, this);
};

GraphHopperGeocoding.prototype.clearLocation = function () {
    this.location_bias = undefined;
};

GraphHopperGeocoding.prototype.getParametersAsQueryString = function (args) {
    var qString = "locale=" + args.locale;

    if (args.query) {
        qString += "&q=" + encodeURIComponent(args.query);
        if (args.location_bias)
            qString += "&point=" + encodeURIComponent(args.location_bias.toString());
        else if (args.point)
            qString += "&point=" + encodeURIComponent(args.point.toString());
    } else {
        qString += "&reverse=true";
        if (args.point)
            qString += "&point=" + encodeURIComponent(args.point.toString());
    }

    if (args.debug)
        qString += "&debug=true";

    if (args.limit)
        qString += "&limit=" + args.limit;

    return qString;
};

GraphHopperGeocoding.prototype.doRequest = function (callback, reqArgs) {
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

module.exports = GraphHopperGeocoding;