GraphHopperRouting = function (args) {
    this.copyProperties(args, this);
    this.points = [];

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
};

GraphHopperRouting.prototype.copyProperties = function (args, argsInto) {
    if (!args)
        return argsInto;

    if (args.host)
        argsInto.host = args.host;
    else
        argsInto.host = "https://graphhopper.com/api/1";

    if (args.vehicle)
        argsInto.vehicle = args.vehicle;
    else
        argsInto.vehicle = "car";

    if (args.key)
        argsInto.key = args.key;

    if (args.debug)
        argsInto.debug = args.debug;
    else
        argsInto.debug = false;

    if (args.data_type)
        argsInto.data_type = args.data_type;
    else
        argsInto.data_type = "json";

    if (args.locale)
        argsInto.locale = args.locale;
    else
        argsInto.locale = "en";

    if (args.instructions)
        argsInto.instructions = args.instructions;
    else
        argsInto.instructions = true;

    if (args.points_encoded)
        argsInto.points_encoded = args.points_encoded;
    else
        argsInto.points_encoded = true;

    if (args.elevation)
        argsInto.elevation = args.elevation;
    else
        argsInto.elevation = false;

// TODO make reading of /api/1/info/ possible
//    this.elevation = false;
//    var featureSet = this.features[this.vehicle];
//    if (featureSet && featureSet.elevation) {
//        if ('elevation' in params)
//            this.elevation = params.elevation;
//        else
//            this.elevation = true;
//    }

    return argsInto;
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

    if (args.vehicle)
        qString += "&vehicle=" + args.vehicle;

    return qString;
};

GraphHopperRouting.prototype.doRequest = function (callback, args) {
    var that = this;
    args = that.copyProperties(args, graphhopper.util.clone(that));
    var url = args.host + "/route?" + that.getParametersAsQueryString(args) + "&key=" + args.key;

    $.ajax({
        timeout: 5000,
        url: url,
        type: "GET",
        dataType: args.data_type,
        crossDomain: true
    }).done(function (json) {
        if (json.paths) {
            for (var i = 0; i < json.paths.length; i++) {
                var path = json.paths[i];
                // convert encoded polyline to geo json
                if (path.points_encoded) {
                    var tmpArray = graphhopper.util.decodePath(path.points, that.elevation);
                    path.points = {
                        "type": "LineString",
                        "coordinates": tmpArray
                    };
                }
            }
        }
        callback(json);

    }).fail(function (jqXHR) {

        if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
            callback(jqXHR.responseJSON);

        } else {
            callback({
                "message": "Unknown error",
                "details": "Error for " + url
            });
        }
    });
};

GraphHopperRouting.prototype.getGraphHopperMapsLink = function () {
    return this.graphhopper_maps_host + this.getParametersAsQueryString(this);
};

GraphHopperRouting.prototype.getTurnText = function (sign) {
    return this.turn_sign_map[sign];
};
