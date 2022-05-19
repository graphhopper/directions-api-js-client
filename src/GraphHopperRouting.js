let request = require('axios');
var GHUtil = require("./GHUtil");
let ghUtil = new GHUtil();

GraphHopperRouting = function (args, requestDefaults) {
    this.defaults = {
        profile: "car",
        debug: false,
        locale: "en",
        points_encoded: true,
        instructions: true,
        elevation: true,
        optimize: "false"
    }
    if (requestDefaults)
        Object.keys(requestDefaults).forEach(key => {
            this.defaults[key] = requestDefaults[key];
        });

    // required API key
    this.key = args.key;
    this.host = args.host ? args.host : "https://graphhopper.com/api/1";
    this.endpoint = args.endpoint ? args.endpoint : '/route';
    this.timeout = args.timeout ? args.timeout : 10000;
    this.turn_sign_map = args.turn_sign_map ? args.turn_sign_map : {
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
};

/**
 * Execute the routing request using the provided args.
 */
GraphHopperRouting.prototype.doRequest = function (reqArgs) {
    Object.keys(this.defaults).forEach(key => {
        if (!reqArgs[key]) reqArgs[key] = this.defaults[key];
    });
    let url = this.host + this.endpoint + "?key=" + this.key;
    let that = this;

    return new Promise((resolve, reject) => {
        request.post(url, reqArgs, {
            timeout: that.timeout,
            headers: {'Content-Type': 'application/json'}
        })
            .then(res => {
                if (res.status !== 200) {
                    reject(ghUtil.extractError(res, url));
                    return;
                }
                if (res.data.paths) {
                    for (let i = 0; i < res.data.paths.length; i++) {
                        let path = res.data.paths[i];
                        // convert encoded polyline to geo json
                        if (path.points_encoded) {
                            let tmpArray = ghUtil.decodePath(path.points, reqArgs.elevation);
                            path.points = {
                                "type": "LineString", "coordinates": tmpArray
                            };

                            let tmpSnappedArray = ghUtil.decodePath(path.snapped_waypoints, reqArgs.elevation);
                            path.snapped_waypoints = {
                                "type": "LineString", "coordinates": tmpSnappedArray
                            };
                        }
                        if (path.instructions) {
                            for (let j = 0; j < path.instructions.length; j++) {
                                // Add a LngLat to every instruction
                                let interval = path.instructions[j].interval;
                                // The second parameter of slice is non inclusive, therefore we have to add +1
                                path.instructions[j].points = path.points.coordinates.slice([interval[0], interval[1] + 1]);
                            }
                        }
                    }
                }
                resolve(res.data);
            })
            .catch(err => {
                reject(ghUtil.extractError(err.response, url));
            });
    });
};

GraphHopperRouting.prototype.info = function () {
    let that = this;

    return new Promise((resolve, reject) => {
        let url = that.host + "/info?key=" + that.key;

        request.get(url, {timeout: that.timeout, headers: {'Content-Type': 'application/json'}})
            .then(res => {
                if (res.status !== 200) {
                    reject(ghUtil.extractError(res, url));
                    return;
                }
                resolve(res.data);
            })
            .catch(err => {
                console.log(err)
                reject(ghUtil.extractError(err.response, url));
            });
    });
};

GraphHopperRouting.prototype.i18n = function (args) {
    let locale = args && args.locale ? args.locale : this.defaults.locale;
    let that = this;

    return new Promise((resolve, reject) => {
        let url = that.host + "/i18n/" + locale + "?key=" + that.key;

        request.get(url, {timeout: that.timeout, headers: {'Content-Type': 'application/json'}})
            .then(res => {
                if (res.status !== 200) {
                    reject(ghUtil.extractError(res, url));
                    return;
                }
                resolve(res.data);
            })
            .catch(err => {
                reject(ghUtil.extractError(err.response, url));
            });
    });
};

GraphHopperRouting.prototype.getTurnText = function (sign) {
    return this.turn_sign_map[sign];
};

module.exports = GraphHopperRouting;