GraphHopperIsochrone = function (args) {
    this.time_limit = 600;
    this.buckets = 3;
    this.vehicle = "car";
    this.point;
    this.host = "https://graphhopper.com/api/1";
    this.debug = false;
    this.basePath = '/isochrone';

    graphhopper.util.copyProperties(args, this);
};

GraphHopperIsochrone.prototype.getParametersAsQueryString = function (args) {
    var qString = "point=" + args.point;
    qString += "&time_limit=" + args.time_limit;
    qString += "&buckets=" + args.buckets;
    qString += "&vehicle=" + args.vehicle;

    if (args.debug)
        qString += "&debug=true";

    return qString;
};

GraphHopperIsochrone.prototype.doRequest = function (callback, reqArgs) {
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