let request = require('axios');

let GHUtil = require("./GHUtil");
let ghUtil = new GHUtil();

GraphHopperMapMatching = function (args, requestDefaults) {
    this.defaults = {
        profile: "car",
        gps_accuracy: 20,
        debug: false,
        max_visited_nodes: 3000,
        locale: "en",
        points_encoded: true,
        instructions: true,
        elevation: true,
        data_type: "json"
    }
    if (requestDefaults)
        Object.keys(requestDefaults).forEach(key => {
            this.defaults[key] = requestDefaults[key];
        });

    this.key = args.key;
    this.host = args.host ? args.host : "https://graphhopper.com/api/1";
    this.endpoint = args.endpoint ? args.endpoint : '/match';
    this.timeout = args.timeout ? args.timeout : 100000;
};

GraphHopperMapMatching.prototype.getParametersAsQueryString = function (args) {
    let qString = "locale=" + args.locale;
    // TODO NOW: profile not yet supported in API
    qString += "&vehicle=" + args.profile;
    qString += "&gps_accuracy=" + args.gps_accuracy;
    qString += "&max_visited_nodes=" + args.max_visited_nodes;
    qString += "&type=" + args.data_type;
    qString += "&instructions=" + args.instructions;
    qString += "&points_encoded=" + args.points_encoded;
    qString += "&elevation=" + args.elevation;

    if (args.debug)
        qString += "&debug=true";
    return qString;
};

GraphHopperMapMatching.prototype.doRequest = function (content, reqArgs) {
    if (!reqArgs) reqArgs = {}
    Object.keys(this.defaults).forEach(key => {
        if (!reqArgs[key]) reqArgs[key] = this.defaults[key];
    });

    let url = this.host + this.endpoint + "?" + this.getParametersAsQueryString(reqArgs) + "&key=" + this.key;
    let timeout = this.timeout;

    return new Promise(function (resolve, reject) {
        request.post(url, content, {
            timeout: timeout,
            headers: {'Content-Type': 'application/xml'}
        })
            .then(res => {
                if (res.status !== 200) {
                    reject(ghUtil.extractError(res, url));
                } else if (res) {

                    if (res.data.paths) {
                        for (let i = 0; i < res.data.paths.length; i++) {
                            let path = res.data.paths[i];
                            // convert encoded polyline to geo json
                            if (path.points_encoded) {
                                let tmpArray = ghUtil.decodePath(path.points, reqArgs.elevation);
                                path.points = {
                                    "type": "LineString",
                                    "coordinates": tmpArray
                                };

                                // for now delete this
                                delete path.snapped_waypoints;
                            }
                        }
                    }
                    resolve(res.data);
                }
            })
            .catch(err => {
                reject(ghUtil.extractError(err.response, url));
            });
    });
};

module.exports = GraphHopperMapMatching;