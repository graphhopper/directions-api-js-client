$(document).ready(function (e) {
    jQuery.support.cors = true;

    $(".tab-content").css("display", "none");
    $(".tabs-menu a").click(function (event) {
        // event.preventDefault();
        showTab($(this));
    });

    function showTab(thisDiv) {
        thisDiv.parent().addClass("current");
        thisDiv.parent().siblings().removeClass("current");
        var tab = thisDiv.attr("href");
        $(".tab-content").not(tab).css("display", "none");
        $(tab).fadeIn();

        // a bit hackish to refresh the map
        routingMap.invalidateSize(false);
        vrpMap.invalidateSize(false);
    }

    var host;

    //
    // Sign-up for free and get your own key: https://graphhopper.com/#directions-api
    //
    var defaultKey = "2929232f-74f8-44cc-8850-76709888e2de";
    var profile = "car";

    // create a routing client to fetch real routes, elevation.true is only supported for vehicle bike or foot
    var ghRouting = new GraphHopperRouting({key: defaultKey, host: host, vehicle: profile, elevation: false});
    var ghGeocoding = new GraphHopperGeocoding({key: defaultKey, host: host, limit: 8, locale: "en" /* currently fr, en, de and it are explicitely supported */});
    var ghMatrix = new GraphHopperMatrix({key: defaultKey, host: host, vehicle: profile});
    var ghOptimization = new GraphHopperOptimization({key: defaultKey, host: host, profile: profile});
    if (location.protocol === "fle:") {
        ghOptimization.host = 'http://localhost:8080';
        ghOptimization.basePath = '';
    }

    var overwriteExistingKey = function () {
        var key = $("#custom_key_input").val();
        if (key && key !== defaultKey) {
            $("#custom_key_enabled").show();

            ghRouting.key = key;
            ghMatrix.key = key;
            ghGeocoding.key = key;
            ghOptimization.key = key;
        } else {
            $("#custom_key_enabled").hide();
        }
    };
    overwriteExistingKey();
    $("#custom_key_button").click(overwriteExistingKey);

    var routingMap = createMap('routing-map');
    setupRoutingAPI(routingMap, ghRouting);

    var vrpMap = createMap('vrp-map');
    setupTourOptimizationAPI(vrpMap, ghOptimization, ghRouting);

    setupGeocodingAPI(ghGeocoding);

    setupMatrixAPI(ghMatrix);

    var tmpTab = window.location.hash;
    if (!tmpTab)
        tmpTab = "#routing";

    showTab($(".tabs-menu li > a[href='" + tmpTab + "']"));
});

function setupRoutingAPI(map, ghRouting) {
    map.setView([52.521235, 13.3992], 12);
    var iconObject = L.icon({
        iconUrl: './img/marker-icon.png',
        shadowSize: [50, 64],
        shadowAnchor: [4, 62],
        iconAnchor: [12, 40]
    });
    var instructionsDiv = $("#instructions");
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

                    $("#routing-response").text(str);

                } else {
                    var path = json.paths[0];
                    routingLayer.addData({
                        "type": "Feature",
                        "geometry": path.points
                    });
                    var outHtml = "Distance in meter:" + path.distance;
                    outHtml += "<br/>Times in seconds:" + path.time / 1000;
                    outHtml += "<br/><a href='" + ghRouting.getGraphHopperMapsLink() + "'>GraphHopper Maps</a>";
                    $("#routing-response").html(outHtml);

                    if (path.bbox) {
                        var minLon = path.bbox[0];
                        var minLat = path.bbox[1];
                        var maxLon = path.bbox[2];
                        var maxLat = path.bbox[3];
                        var tmpB = new L.LatLngBounds(new L.LatLng(minLat, minLon), new L.LatLng(maxLat, maxLon));
                        map.fitBounds(tmpB);
                    }

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

    var instructionsHeader = $("#instructions-header");
    instructionsHeader.click(function () {
        instructionsDiv.toggle();
    });

    var routingLayer = L.geoJson().addTo(map);
    routingLayer.options = {
        style: {color: "#00cc33", "weight": 5, "opacity": 0.6}
    };
}

function setupTourOptimizationAPI(map, ghOptimization, ghRouting) {
    map.setView([51.505, -0.09], 13);

    L.NumberedDivIcon = L.Icon.extend({
        options: {
            iconUrl: './img/marker-icon.png',
            number: '',
            shadowUrl: null,
            iconSize: new L.Point(25, 41),
            iconAnchor: new L.Point(13, 41),
            popupAnchor: new L.Point(0, -33),
            className: 'leaflet-div-icon'
        },
        createIcon: function () {
            var div = document.createElement('div');
            var img = this._createImg(this.options['iconUrl']);
            var numdiv = document.createElement('div');
            numdiv.setAttribute("class", "number");
            numdiv.innerHTML = this.options['number'] || '';
            div.appendChild(img);
            div.appendChild(numdiv);
            this._setIconStyles(div, 'icon');
            return div;
        },
        // you could change this to add a shadow like in the normal marker if you really wanted
        createShadow: function () {
            return null;
        }
    });

    var addPointToMap = function (lat, lng, index) {
        index = parseInt(index);
        if (index === 0) {
            new L.Marker([lat, lng], {
                icon: new L.NumberedDivIcon({iconUrl: './img/marker-icon-green.png', number: '1'}),
                bounceOnAdd: true,
                bounceOnAddOptions: {duration: 800, height: 200}
            }).addTo(routingLayer);
        } else {
            new L.Marker([lat, lng], {
                icon: new L.NumberedDivIcon({number: '' + (index + 1)}),
                bounceOnAdd: true,
                bounceOnAddOptions: {duration: 800, height: 200},
            }).addTo(routingLayer);
        }
    };

    map.on('click', function (e) {
        addPointToMap(e.latlng.lat, e.latlng.lng, ghOptimization.points.length);
        ghOptimization.addPoint(new GHInput(e.latlng.lat, e.latlng.lng));
    });

    var routingLayer = L.geoJson().addTo(map);
    routingLayer.options.style = function (feature) {
        return feature.properties && feature.properties.style;
    };

    var clearMap = function () {
        ghOptimization.clear();
        routingLayer.clearLayers();
        ghRouting.clearPoints();
        $("#vrp-response").empty();
        $("#vrp-error").empty();
    };

    var createSignupSteps = function () {
        return "<div style='color:black'>To test this example <br/>"
                + "1. <a href='https://graphhopper.com/#directions-api'>sign up for free</a>,<br/>"
                + "2. log in and request a free standard package then <br/>"
                + "3. copy the API key to the text field in the upper right corner<div>";
    };

    var optimizeResponse = function (json) {
        if (json.message) {
            $("#vrp-response").text(" ");

            if (json.message.indexOf("Too many locations") >= 0) {
                $("#vrp-error").empty();
                $("#vrp-error").append(createSignupSteps());
            } else {
                $("#vrp-error").text("An error occured: " + json.message);
            }
            console.log(JSON.stringify(json));
            return;
        }
        var sol = json.solution;
        if (!sol)
            return;

        $("#vrp-response").text("Solution found for " + sol.routes.length + " vehicle(s)! "
                + "Distance: " + Math.floor(sol.distance / 1000) + "km "
                + ", time: " + Math.floor(sol.time / 60 / 1000) + "min "
                + ", costs: " + sol.costs);

        var no_unassigned = sol.unassigned.services.length + sol.unassigned.shipments.length;
        if (no_unassigned > 0)
            $("#vrp-error").append("<br/>unassigned jobs: " + no_unassigned);

        routingLayer.clearLayers();
        for (var routeIndex = 0; routeIndex < sol.routes.length; routeIndex++) {
            var route = sol.routes[routeIndex];

            // fetch real routes from graphhopper
            ghRouting.clearPoints();
            var firstAdd;
            for (var actIndex = 0; actIndex < route.activities.length; actIndex++) {
                var add = route.activities[actIndex].address;
                ghRouting.addPoint(new GHInput(add.lat, add.lon));

                if (!eqAddress(firstAdd, add))
                    addPointToMap(add.lat, add.lon, actIndex);

                if (actIndex === 0)
                    firstAdd = add;
            }

            var routeStyle;
            if (routeIndex === 2) {
                routeStyle = {color: "yellow"};
            } else if (routeIndex === 1) {
                routeStyle = {color: "green"};
            } else {
                routeStyle = {color: "blue"};
            }

            var ghCallback = createGHCallback(routeStyle);
            ghRouting.doRequest(ghCallback, {instructions: false});
        }
    };

    var eqAddress = function (add1, add2) {
        return add1 && add2
                && Math.floor(add1.lat * 1000000) === Math.floor(add2.lat * 1000000)
                && Math.floor(add1.lon * 1000000) === Math.floor(add2.lon * 1000000);
    };

    var createGHCallback = function (routeStyle) {
        return function (json) {
            if (json.message) {
                var str = "An error for the routing occurred: " + json.message;
                if (json.hints)
                    str += json.hints;
                $("#vrp-error").text(str);
                console.log(JSON.stringify(json));

            } else {
                for (var pathIndex = 0; pathIndex < json.paths.length; pathIndex++) {
                    var path = json.paths[pathIndex];
                    routingLayer.addData({
                        "type": "Feature",
                        "geometry": path.points,
                        "properties": {
                            style: routeStyle
                        }
                    });
                }
            }
        };
    };

    var optimizeTour = function () {
        if (ghOptimization.points.length < 3) {
            $("#vrp-response").text("At least 3 points required but was: " + ghOptimization.points.length);
            return;
        }
        $("#vrp-response").text("Calculating ...");
        ghOptimization.doTSPRequest(optimizeResponse);
    };

    $("#vrp_clear_button").click(clearMap);

    $("#set_example_vrp").click(function () {
        $.getJSON("tour-optimization-examples/vrp_lonlat_new.json", function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData, optimizeResponse);
        });
    });

    $("#set_example_tsp").click(function () {
        $.getJSON("tour-optimization-examples/tsp_lonlat_new.json", function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData, optimizeResponse);
        });
    });

    $("#set_example_tsp2").click(function () {
        $.getJSON("tour-optimization-examples/tsp_lonlat_end.json", function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData, optimizeResponse);
        });
    });

    $("#set_example_us_tour").click(function () {
        $.getJSON("tour-optimization-examples/american_road_trip.json", function (jsonData) {

            clearMap();
            map.setView([38.754083, -101.074219], 4);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData, optimizeResponse);
        });
    });

    $("#set_example_uk_tour").click(function () {
        $.getJSON("tour-optimization-examples/uk50.json", function (jsonData) {

            clearMap();
            map.setView([54.136696, -4.592285], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData, optimizeResponse);
        });
    });

    $("#optimize_button").click(optimizeTour);
}

function setupGeocodingAPI(ghGeocoding) {
    //  Find address
    var textField = $("#geocoding_text_field");
    $("#geocoding_search_button").click(function () {
        $("#geocoding-results").empty();
        $("#geocoding-error").empty();

        $("#geocoding-response").empty();
        ghGeocoding.doRequest(function (json) {
            if (json.message) {
                $("#geocoding-error").text("An error occured: " + json.message);
            } else {
                var listUL = $("<ol>");
                $("#geocoding-response").append("Locale:" + ghGeocoding.locale + "<br/>").append(listUL);
                for (var hitIdx in json.hits) {
                    var hit = json.hits[hitIdx];

                    $("<li>" + dataToText(hit) + "</li>").appendTo(listUL);
                }
            }
        }, {query: textField.val()});
    });


    function dataToText(data) {
        var text = "";
        if (data.name)
            text += data.name;

        if (data.postcode)
            text = insComma(text, data.postcode);

        // make sure name won't be duplicated
        if (data.city && text.indexOf(data.city) < 0)
            text = insComma(text, data.city);

        if (data.country && text.indexOf(data.country) < 0)
            text = insComma(text, data.country);
        return text;
    }

    function insComma(textA, textB) {
        if (textA.length > 0)
            return textA + ", " + textB;
        return textB;
    }
}

function setupMatrixAPI(ghMatrix) {
    $('#matrix_search_button').click(function () {

        // possible out_array options are: weights, distances, times, paths
        ghMatrix.addOutArray("distances");
        ghMatrix.addOutArray("times");

        ghMatrix.clearPoints();
        $('.point').each(function (idx, div) {
            // parse the input strings and adds it as from_point and to_point
            ghMatrix.addPoint(new GHInput($(div).val()));

            // To create an NxM matrix you can simply use the other methods e.g.
            // ghm.addFromPoint(new GHInput(someCoordinateString))
            // or
            // ghm.addToPoint(new GHInput(someCoordinateString))
        });

        $("#matrix-error").empty();
        $("#matrix-response").empty();

        ghMatrix.doRequest(function (json) {
            if (json.message) {
                var str = "An error occured: " + json.message;
                if (json.hints)
                    str += json.hints;

                $("#matrix-error").text(str);
            } else {
                var outHtml = "Distances in meters: <br/>" + ghMatrix.toHtmlTable(json.distances);
                outHtml += "<br/><br/>Times in seconds: <br/>" + ghMatrix.toHtmlTable(json.times);
                $("#matrix-response").html(outHtml);
            }
        });

        return false;
    });
}

function createMap(divId) {
    var osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    var mapquest = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
        attribution: osmAttr + ', <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>',
        subdomains: ['otile1', 'otile2', 'otile3', 'otile4']
    });

    var openMapSurfer = L.tileLayer('http://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}', {
        attribution: osmAttr + ', <a href="http://openmapsurfer.uni-hd.de/contact.html">GIScience Heidelberg</a>'
    });

    var omniscale = L.tileLayer.wms('https://maps.omniscale.net/v1/graphhp-7ae5b6f7/tile', {
        layers: 'osm',
        attribution: osmAttr + ', &copy; <a href="http://maps.omniscale.com/">Omniscale</a>'
    });

    var map = L.map(divId, {layers: [omniscale]});
    L.control.layers({"MapQuest": mapquest,
        "Omniscale": omniscale,
        "OpenMapSurfer": openMapSurfer, }).addTo(map);
    return map;
}
