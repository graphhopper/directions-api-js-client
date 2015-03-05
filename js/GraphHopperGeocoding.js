GraphHopperGeocoding = function (args) {
    // prefer results from a certain location (type: GHInput)
    this.location_bias;
    // the query
    this.query;

    this.setProperties(args);
};

GraphHopperGeocoding.prototype.clearLocation = function () {
    this.location_bias = undefined;
};

GraphHopperGeocoding.prototype.setProperties = function (args) {
    if (args.host)
        this.host = args.host;
    else
        this.host = "https://graphhopper.com/api/1";

    if (args.key)
        this.key = args.key;

    if (args.debug)
        this.debug = args.debug;
    else
        this.debug = false;

    if (args.locale)
        this.locale = args.locale;
    else
        this.locale = "en";

    if (args.query)
        this.query = args.query;

    if (args.location_bias)
        this.location_bias = args.location_bias;
    
    if (args.limit)
        this.limit = args.limit;
};

GraphHopperGeocoding.prototype.getParametersAsQueryString = function () {
    var qString = "locale=" + this.locale;

    qString += "&q=" + encodeURIComponent(this.query);

    if (this.location_bias)
        qString += "&point=" + encodeURIComponent(this.location_bias.toString());

    if (this.debug)
        qString += "&debug=true";
    
    if (this.limit)
        qString += "&limit=" + this.limit;

    return qString;
};

GraphHopperGeocoding.prototype.doRequest = function (callback, args) {
    var that = this;
    if (args)
        that.setProperties(args);

    var url = this.host + "/geocode?" + this.getParametersAsQueryString() + "&key=" + this.key;

    $.ajax({
        timeout: 5000,
        url: url,
        type: "GET",
        dataType: this.data_type,
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