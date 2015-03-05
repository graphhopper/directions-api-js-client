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
    var tp = L.Browser.retina ? "lr" : "ls";
    var lyrk = L.tileLayer('https://tiles.lyrk.org/' + tp + '/{z}/{x}/{y}?apikey=6e8cfef737a140e2a58c8122aaa26077', {
        attribution: osmAttr + ', <a href="https://geodienste.lyrk.de/">Lyrk</a>',
        subdomains: ['a', 'b', 'c']
    });

    var map = L.map('map', {layers: [lyrk]});
    map.setView([51.505, -0.09], 13);
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
                if (json.info && json.info.errors) {
                    $("#response").text("An error occured: " + json.info.errors[0].message);
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