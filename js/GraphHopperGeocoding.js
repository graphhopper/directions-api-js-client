GraphHopperGeocoding = function (args) {
    // prefer results from a certain location (type: GHInput)
    this.location_bias;
    // the query
    this.query;

    this.copyProperties(args, this);
};

GraphHopperGeocoding.prototype.clearLocation = function () {
    this.location_bias = undefined;
};

GraphHopperGeocoding.prototype.copyProperties = function (args, intoArgs) {
    if (!args)
        return argsInto;

    if (args.host)
        intoArgs.host = args.host;
    else
        intoArgs.host = "https://graphhopper.com/api/1";

    if (args.key)
        intoArgs.key = args.key;

    if (args.debug)
        intoArgs.debug = args.debug;
    else
        intoArgs.debug = false;

    if (args.locale)
        intoArgs.locale = args.locale;
    else
        intoArgs.locale = "en";

    if (args.query)
        intoArgs.query = args.query;

    if (args.location_bias)
        intoArgs.location_bias = args.location_bias;

    if (args.limit)
        intoArgs.limit = args.limit;
    
    return intoArgs;
};

GraphHopperGeocoding.prototype.getParametersAsQueryString = function (args) {
    var qString = "locale=" + args.locale;

    qString += "&q=" + encodeURIComponent(args.query);

    if (args.location_bias)
        qString += "&point=" + encodeURIComponent(args.location_bias.toString());

    if (args.debug)
        qString += "&debug=true";

    if (args.limit)
        qString += "&limit=" + args.limit;

    return qString;
};

GraphHopperGeocoding.prototype.doRequest = function (callback, args) {
    var that = this;
    args = that.copyProperties(args, graphhopper.util.clone(that));
    var url = args.host + "/geocode?" + that.getParametersAsQueryString(args) + "&key=" + args.key;

    $.ajax({
        timeout: 5000,
        url: url,
        type: "GET",
        dataType: args.data_type,
        crossDomain: true
    }).done(function (json) {
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