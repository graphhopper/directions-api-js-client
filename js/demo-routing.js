$(document).ready(function (e) {
    jQuery.support.cors = true;
    var args = {key: "YOUR_KEY",
        vehicle: "car",
        elevation: false};

    // elevation: true is only supported for vehicle bike or foot

    var ghRouting = new GraphHopperRouting(args);

    // ***********
    //  Map Setup
    // ***********
    var osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    var mapquest = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
        attribution: osmAttr + ', <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>',
        subdomains: ['otile1', 'otile2', 'otile3', 'otile4']
    });

    var map = L.map('map', {layers: [mapquest]});
    map.setView([52.521235, 13.3992], 12);
    var iconObject = L.icon({
        iconUrl: './img/marker-icon.png',
        shadowSize: [50, 64],
        shadowAnchor: [4, 62],
        iconAnchor: [12, 40]
    });
    map.on('click', function (e) {
        if (ghRouting.points.length > 1) {
            ghRouting.clearPoints();
            routingLayer.clearLayers();
        }

        L.marker(e.latlng, {icon: iconObject}).addTo(routingLayer);
        ghRouting.addPoint(new GHInput(e.latlng.lat, e.latlng.lng));
        if (ghRouting.points.length > 1) {
            // ******************
            //  Calculate route! 
            // ******************
            ghRouting.doRequest(function (json) {
                if (json.message) {
                    var str = "An error occured: " + json.message;
                    if (json.hints)
                        str += json.hints;

                    $("#response").text(str);

                } else {
                    var path = json.paths[0];
                    routingLayer.addData({
                        "type": "Feature",
                        "geometry": path.points
                    });
                    var outHtml = "Distance in meter:" + path.distance;
                    outHtml += "<br/>Times in seconds:" + path.time / 1000;
                    outHtml += "<br/><a href='" + ghRouting.getGraphHopperMapsLink() + "'>GraphHopper Maps</a>";
                    $("#response").html(outHtml);

                    if (path.bbox) {
                        var minLon = path.bbox[0];
                        var minLat = path.bbox[1];
                        var maxLon = path.bbox[2];
                        var maxLat = path.bbox[3];
                        var tmpB = new L.LatLngBounds(new L.LatLng(minLat, minLon), new L.LatLng(maxLat, maxLon));
                        map.fitBounds(tmpB);
                    }

                    var instructionsDiv = $("#instructions");
                    instructionsDiv.empty();
                    if (path.instructions) {
                        var allPoints = path.points.coordinates;
                        var listUL = $("<ol>");
                        instructionsDiv.append(listUL);
                        for (var idx in path.instructions) {
                            var instr = path.instructions[idx];

                            // use 'interval' to find the geometry (list of points) until the next instruction
                            var instruction_points = allPoints.slice(instr.interval[0], instr.interval[1]);

                            // use 'sign' to display e.g. equally named images

                            $("<li>" + instr.text + " <small>(" + ghRouting.getTurnText(instr.sign) + ")</small>"
                                    + " for " + instr.distance + "m and " + Math.round(instr.time / 1000) + "sec"
                                    + ", geometry points:" + instruction_points.length + "</li>").
                                    appendTo(listUL);
                        }
                    }
                }
            });
        }
    });
    var routingLayer = L.geoJson().addTo(map);
    routingLayer.options = {
        style: {color: "#00cc33", "weight": 5, "opacity": 0.6}
    };
});