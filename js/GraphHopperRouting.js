GraphHopperRouting = function (args) {
    this.setProperties(args);
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

GraphHopperRouting.prototype.setProperties = function (args) {
    if (args.host)
        this.host = args.host;
    else
        this.host = "https://graphhopper.com/api/1";

    if (args.vehicle)
        this.vehicle = args.vehicle;
    else
        this.vehicle = "car";

    if (args.key)
        this.key = args.key;

    if (args.debug)
        this.debug = args.debug;
    else
        this.debug = false;

    if (args.data_type)
        this.data_type = args.data_type;
    else
        this.data_type = "json";

    if (args.locale)
        this.locale = args.locale;
    else
        this.locale = "en";

    if (args.instructions)
        this.instructions = args.instructions;
    else
        this.instructions = true;

    if (args.points_encoded)
        this.points_encoded = args.points_encoded;
    else
        this.points_encoded = true;

    if (args.elevation)
        this.elevation = args.elevation;
    else
        this.elevation = false;

// TODO make reading of /api/1/info/ possible
//    this.elevation = false;
//    var featureSet = this.features[this.vehicle];
//    if (featureSet && featureSet.elevation) {
//        if ('elevation' in params)
//            this.elevation = params.elevation;
//        else
//            this.elevation = true;
//    }
};

GraphHopperRouting.prototype.clearPoints = function () {
    this.points.length = 0;
};

GraphHopperRouting.prototype.addPoint = function (latlon) {
    this.points.push(latlon);
};

GraphHopperRouting.prototype.getParametersAsQueryString = function () {
    var qString = "locale=" + this.locale;

    for (var idx in this.points) {
        var p = this.points[idx];
        qString += "&point=" + encodeURIComponent(p.toString());
    }

    if (this.debug)
        qString += "&debug=true";

    qString += "&type=" + this.data_type;

    if (this.instructions)
        qString += "&instructions=" + this.instructions;

    if (this.points_encoded)
        qString += "&points_encoded=" + this.points_encoded;

    if (this.elevation)
        qString += "&elevation=" + this.elevation;

    return qString;
};

GraphHopperRouting.prototype.doRequest = function (callback, args) {
    var that = this;
    if (args)
        that.setProperties(args);

    var url = this.host + "/route?" + this.getParametersAsQueryString() + "&key=" + this.key;

    $.ajax({
        timeout: 5000,
        url: url,
        type: "GET",
        dataType: this.data_type,
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
        var msg = "Unknown error";

        if (jqXHR.responseJSON && jqXHR.responseJSON.message)
            msg = jqXHR.responseJSON.message;

        var details = "Error for " + url;
        var json = {
            "info": {
                "errors": [{
                        "message": msg,
                        "details": details
                    }]
            }
        };
        callback(json);
    });
};

GraphHopperRouting.prototype.getGraphHopperMapsLink = function () {
    return this.graphhopper_maps_host + this.getParametersAsQueryString();
};

GraphHopperRouting.prototype.getTurnText = function (sign) {
    return this.turn_sign_map[sign];
};
