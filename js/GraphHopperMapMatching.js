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

    graphhopper.util.copyProperties(args, this);
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

GraphHopperMapMatching.prototype.doRequest = function (content, callback, reqArgs) {
    var that = this;
    var args = graphhopper.util.clone(that);
    if (reqArgs)
        args = graphhopper.util.copyProperties(reqArgs, args);

    var url = args.host + args.basePath + "?" + that.getParametersAsQueryString(args);
    if (args.key)
        url += "&key=" + args.key;

    $.ajax({
        timeout: 20000,
        url: url,
        contentType: "application/xml",
        type: "POST",
        crossDomain: true,
        data: content
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

                    // for now delete this
                    delete path.snapped_waypoints;
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
