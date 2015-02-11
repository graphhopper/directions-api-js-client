GraphHopperMatrix = function (host) {
    if (host)
        this.host = host;
    else
        this.host = "https://graphhopper.com/api/1";

    this.vehicle = "car";
    this.debug = false;
    this.dataType = "json";
    this.from_points = [];
    this.to_points = [];
    this.out_arrays = [];

    this.graphhopper_maps_host = "https://graphhopper.com/maps/?";
};

GraphHopperMatrix.prototype.setKey = function (key) {
    this.key = key;
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

GraphHopperMatrix.prototype.setVehicle = function (vehicle) {
    this.vehicle = vehicle;
};

GraphHopperMatrix.prototype.doRequest = function (callback) {
    var that = this;
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
        dataType: this.dataType,
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

GHInput = function (input) {
    this.set(input);
};

GHInput.prototype.round = function (val, precision) {
    if (precision === undefined)
        precision = 1e6;
    return Math.round(val * precision) / precision;
};

GHInput.prototype.setCoord = function (lat, lng) {
    this.lat = this.round(lat);
    this.lng = this.round(lng);
    this.input = this.toString();
};

GHInput.isObject = function (value) {
    var stringValue = Object.prototype.toString.call(value);
    return (stringValue.toLowerCase() === "[object object]");
};

GHInput.isString = function (value) {
    var stringValue = Object.prototype.toString.call(value);
    return (stringValue.toLowerCase() === "[object string]");
};

GHInput.prototype.set = function (strOrObject) {
    // either text or coordinates or object
    this.input = strOrObject;

    if (GHInput.isObject(strOrObject)) {
        this.setCoord(strOrObject.lat, strOrObject.lng);
    } else if (GHInput.isString(strOrObject)) {
        var index = strOrObject.indexOf(",");
        if (index >= 0) {
            this.lat = this.round(parseFloat(strOrObject.substr(0, index)));
            this.lng = this.round(parseFloat(strOrObject.substr(index + 1)));
        }
    }
};

GHInput.prototype.toString = function () {
    if (this.lat !== undefined && this.lng !== undefined)
        return this.lat + "," + this.lng;
    return undefined;
};