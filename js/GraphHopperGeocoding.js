GraphHopperGeocoding = function (args) {
    // prefer results from a certain location (type: GHInput)
    this.location_bias;
    // the query
    this.query;
    this.host = "https://graphhopper.com/api/1";
    this.debug = false;
    this.locale = "en";
    this.basePath = '/geocode';

    graphhopper.util.copyProperties(args, this);
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
    var args = graphhopper.util.clone(that);
    if (reqArgs)
        args = graphhopper.util.copyProperties(reqArgs, args);

    var url = args.host + args.basePath + "?" + this.getParametersAsQueryString(args) + "&key=" + args.key;

    $.ajax({
        timeout: 5000,
        url: url,
        type: "GET",
        dataType: args.data_type
    }).done(function (json) {
        callback(json);

    }).fail(function (jqXHR) {
        var msg = "Unknown error";

        if (jqXHR.responseJSON && jqXHR.responseJSON.message)
            msg = jqXHR.responseJSON.message;

        var details = "Error for " + url;
        var json = {
            "message": msg,
            "details": details
        };
        callback(json);
    });
};