let request = require('axios');

let GHUtil = require("./GHUtil");
let ghUtil = new GHUtil();

GraphHopperIsochrone = function (args, requestDefaults) {
    this.defaults = {
        time_limit: 600,
        distance_limit: 0,
        buckets: 3,
        profile: "car",
        debug: false,
        reverse_flow: false
    };
    if (requestDefaults)
        Object.keys(requestDefaults).forEach(key => {
            this.defaults[key] = requestDefaults[key];
        });

    this.key = args.key;
    this.host = args.host ? args.host : "https://graphhopper.com/api/1";
    this.endpoint = args.endpoint ? args.endpoint : '/isochrone';
    this.timeout = args.timeout ? args.timeout : 30000;
};

GraphHopperIsochrone.prototype.getParametersAsQueryString = function (args) {
    let qString = "point=" + args.point;
    qString += "&time_limit=" + args.time_limit;
    qString += "&distance_limit=" + args.distance_limit;
    qString += "&buckets=" + args.buckets;
    qString += "&profile=" + args.profile;
    qString += "&reverse_flow=" + args.reverse_flow;

    if (args.debug)
        qString += "&debug=true";

    return qString;
};

GraphHopperIsochrone.prototype.doRequest = function (reqArgs) {
    Object.keys(this.defaults).forEach(key => {
        if (!reqArgs[key]) reqArgs[key] = this.defaults[key];
    });

    let url = this.host + this.endpoint + "?" + this.getParametersAsQueryString(reqArgs) + "&key=" + this.key;
    let that = this;

    return new Promise(function (resolve, reject) {

        request
            .get(url, {timeout: that.timeout})
            .then(res => {
                if (res.status !== 200) {
                    reject(ghUtil.extractError(res, url));
                } else if (res) {
                    resolve(res.data);
                }
            })
            .catch(err => {
                reject(ghUtil.extractError(err.response, url));
            })
    });
};

module.exports = GraphHopperIsochrone;