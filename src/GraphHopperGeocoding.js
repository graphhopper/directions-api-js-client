let request = require('axios');

let GHUtil = require("./GHUtil");
let ghUtil = new GHUtil();

GraphHopperGeocoding = function (args, requestDefaults) {
    this.defaults = {
        debug: false,
        locale: "en"
    }
    if (requestDefaults)
        Object.keys(requestDefaults).forEach(key => {
            this.defaults[key] = requestDefaults[key];
        });

    this.key = args.key;
    this.host = args.host ? args.host : "https://graphhopper.com/api/1";
    this.endpoint = args.endpoint ? args.endpoint : '/geocode';
    this.timeout = args.timeout ? args.timeout : 10000;
};

GraphHopperGeocoding.prototype.getParametersAsQueryString = function (args) {
    let qString = "locale=" + args.locale;

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

GraphHopperGeocoding.prototype.doRequest = function (reqArgs) {
    if (!reqArgs) reqArgs = {}
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
            });
    });
};

module.exports = GraphHopperGeocoding;