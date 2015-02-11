GraphHopperMatrix = function (args) {
    this.setProperties(args);
    this.from_points = [];
    this.to_points = [];
    this.out_arrays = [];

    this.graphhopper_maps_host = "https://graphhopper.com/maps/?";
};

GraphHopperMatrix.prototype.setProperties = function (args) {
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
};

GraphHopperMatrix.prototype.addPoint = function (latlon) {
    this.addFromPoint(latlon);
    this.addToPoint(latlon);
};

GraphHopperMatrix.prototype.addFromPoint = function (latlon) {
    this.from_points.push(latlon);
};

GraphHopperMatrix.prototype.addToPoint = function (latlon) {
    this.to_points.push(latlon);
};

GraphHopperMatrix.prototype.addOutArray = function (type) {
    this.out_arrays.push(type);
};

GraphHopperMatrix.prototype.doRequest = function (callback, args) {
    var that = this;
    if (args)
        that.setProperties(args);

    var url = this.host + "/matrix?vehicle=" + this.vehicle + "&key=" + this.key;

    for (var idx in this.from_points) {
        var p = this.from_points[idx];
        url += "&from_point=" + encodeURIComponent(p.toString());
    }
    for (var idx in this.to_points) {
        var p = this.to_points[idx];
        url += "&to_point=" + encodeURIComponent(p.toString());
    }

    if (this.out_arrays) {
        for (var idx in this.out_arrays) {
            var type = this.out_arrays[idx];
            url += "&out_array=" + type;
        }
    }

    if (this.debug)
        url += "&debug=true";

    $.ajax({
        timeout: 30000,
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

GraphHopperMatrix.prototype.toHtmlTable = function (doubleArray) {
    var htmlOut = "<table border='1' cellpadding='10'>";

    // header => to points
    htmlOut += "<tr>";

    // upper left corner:
    htmlOut += "<td>&#8595; from &#92; to &#8594;</td>";

    // header with to points
    for (var idxTo in this.to_points) {
        htmlOut += "<td><b>" + this.to_points[idxTo] + "</b></td>";
    }
    htmlOut += "</tr>";

    for (var idxFrom in doubleArray) {
        htmlOut += "<tr>";
        htmlOut += "<td><b>" + this.from_points[idxFrom] + "</b></td>";
        var res = doubleArray[idxFrom];
        for (var idxTo in res) {
            var mapsURL = this.graphhopper_maps_host
                    + "point=" + encodeURIComponent(this.from_points[idxFrom])
                    + "&point=" + encodeURIComponent(this.to_points[idxTo])
                    + "&vehicle=" + this.vehicle;

            htmlOut += "<td> <a href='" + mapsURL + "'>" + res[idxTo] + "</a> </td>";
        }
        htmlOut += "</tr>\n";
    }
    htmlOut += "</table>";
    return htmlOut;
};
