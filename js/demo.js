var iconObject = L.icon({
    iconUrl: './img/marker-icon.png',
    shadowSize: [50, 64],
    shadowAnchor: [4, 62],
    iconAnchor: [12, 40]
});

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
        geocodingMap.invalidateSize(false);
        isochroneMap.invalidateSize(false);
        mapMatchingMap.invalidateSize(false);
    }

    var host;// = "http://localhost:9000/api/1";

    //
    // Sign-up for free and get your own key: https://graphhopper.com/#directions-api
    //
    var defaultKey = "bd5f8b44-bfa8-407a-b868-7f2efc1146d9";
    var profile = "car";

    // create a routing client to fetch real routes, elevation.true is only supported for vehicle bike or foot
    var ghRouting = new GraphHopperRouting({key: defaultKey, host: host, vehicle: profile, elevation: false});
    var ghGeocoding = new GraphHopperGeocoding({key: defaultKey, host: host, limit: 8, locale: "en" /* currently fr, en, de and it are explicitely supported */});
    var ghMatrix = new GraphHopperMatrix({key: defaultKey, host: host, vehicle: profile});
    var ghOptimization = new GraphHopperOptimization({key: defaultKey, host: host, profile: profile});
    var ghIsochrone = new GraphHopperIsochrone({key: defaultKey, host: host, vehicle: profile});
    var ghMapMatching = new GraphHopperMapMatching({key: defaultKey, host: host, vehicle: profile});

//    if (location.protocol === "file:") {
//        ghOptimization.host = 'http://localhost:9000/api/1';
//        ghOptimization.basePath = '/vrp';
//    }

    var overwriteExistingKey = function () {
        var key = $("#custom_key_input").val();
        if (key && key !== defaultKey) {
            $("#custom_key_enabled").show();

            ghRouting.key = key;
            ghMatrix.key = key;
            ghGeocoding.key = key;
            ghOptimization.key = key;
            ghIsochrone.key = key;
            ghMapMatching.key = key;
        } else {
            $("#custom_key_enabled").hide();
        }
    };
    overwriteExistingKey();
    $("#custom_key_button").click(overwriteExistingKey);

    var routingMap = createMap('routing-map');
    setupRoutingAPI(routingMap, ghRouting);

    var vrpMap = createMap('vrp-map');
    setupRouteOptimizationAPI(vrpMap, ghOptimization, ghRouting);

    var geocodingMap = createMap('geocoding-map');
    setupGeocodingAPI(geocodingMap, ghGeocoding);

    setupMatrixAPI(ghMatrix);

    var isochroneMap = createMap('isochrone-map');
    setupIsochrone(isochroneMap, ghIsochrone);

    var mapMatchingMap = createMap('map-matching-map');
    setupMapMatching(mapMatchingMap, ghMapMatching);

    var tmpTab = window.location.hash;
    if (!tmpTab)
        tmpTab = "#routing";

    showTab($(".tabs-menu li > a[href='" + tmpTab + "']"));
});

function setupRoutingAPI(map, ghRouting) {
    map.setView([52.521235, 13.3992], 12);

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

function setupRouteOptimizationAPI(map, ghOptimization, ghRouting) {
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
                + ", time: " + Math.floor(sol.time / 60) + "min "
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
            if (routeIndex === 3) {
                routeStyle = {color: "cyan"};
            } else if (routeIndex === 2) {
                routeStyle = {color: "black"};
            } else if (routeIndex === 1) {
                routeStyle = {color: "green"};
            } else {
                routeStyle = {color: "blue"};
            }

            routeStyle.weight = 5;
            routeStyle.opacity = 1;

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

    var optimizeRoute = function () {
        if (ghOptimization.points.length < 3) {
            $("#vrp-response").text("At least 3 points required but was: " + ghOptimization.points.length);
            return;
        }
        $("#vrp-response").text("Calculating ...");
        ghOptimization.doVRPRequest(optimizeResponse, $("#optimize_vehicles").val());
    };

    $("#vrp_clear_button").click(clearMap);

    // Increase version if one of the examples change, see #2
    var exampleVersion = 2;

    $("#set_example_vrp").click(function () {
        $.getJSON("route-optimization-examples/vrp_lonlat_new.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData, optimizeResponse);
        });
    });

    $("#set_example_tsp").click(function () {
        $.getJSON("route-optimization-examples/tsp_lonlat_new.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData, optimizeResponse);
        });
    });

    $("#set_example_tsp2").click(function () {
        $.getJSON("route-optimization-examples/tsp_lonlat_end.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData, optimizeResponse);
        });
    });

    $("#set_example_us_tour").click(function () {
        $.getJSON("route-optimization-examples/american_road_trip.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([38.754083, -101.074219], 4);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData, optimizeResponse);
        });
    });

    $("#set_example_uk_tour").click(function () {
        $.getJSON("route-optimization-examples/uk50.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([54.136696, -4.592285], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData, optimizeResponse);
        });
    });

    $("#optimize_button").click(optimizeRoute);
}

function setupGeocodingAPI(map, ghGeocoding) {
    //  Find address    
    map.setView([51.505, -0.09], 13);
    var iconObject = L.icon({
        iconUrl: './img/marker-icon.png',
        shadowSize: [50, 64],
        shadowAnchor: [4, 62],
        iconAnchor: [12, 40]
    });
    var geocodingLayer = L.geoJson().addTo(map);
    geocodingLayer.options = {
        style: {color: "#00cc33", "weight": 5, "opacity": 0.6}
    };

    L.NumberedDivIcon = L.Icon.extend({
        options: {
            iconUrl: './img/marker-icon.png',
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
        }
    });

    var clearGeocoding = function () {
        $("#geocoding-results").empty();
        $("#geocoding-error").empty();
        $("#geocoding-response").empty();
        geocodingLayer.clearLayers();
    };

    var mysubmit = function () {
        clearGeocoding();

        ghGeocoding.doRequest(function (json) {
            if (json.message) {
                $("#geocoding-error").text("An error occured: " + json.message);
            } else {
                var listUL = $("<ol>");
                $("#geocoding-response").append("Locale:" + ghGeocoding.locale + "<br/>").append(listUL);
                var minLon, minLat, maxLon, maxLat;
                var counter = 0;
                for (var hitIdx in json.hits) {
                    counter++;
                    var hit = json.hits[hitIdx];

                    var str = counter + ". " + dataToText(hit);
                    $("<div>" + str + "</div>").appendTo(listUL);
                    new L.Marker(hit.point, {
                        icon: new L.NumberedDivIcon({iconUrl: './img/marker-icon-green.png', number: '' + counter})
                    }).bindPopup("<div>" + str + "</div>").addTo(geocodingLayer);

                    if (!minLat || minLat > hit.point.lat)
                        minLat = hit.point.lat;
                    if (!minLon || minLon > hit.point.lng)
                        minLon = hit.point.lng;

                    if (!maxLat || maxLat < hit.point.lat)
                        maxLat = hit.point.lat;
                    if (!maxLon || maxLon < hit.point.lng)
                        maxLon = hit.point.lng;
                }

                if (minLat) {
                    var tmpB = new L.LatLngBounds(new L.LatLng(minLat, minLon), new L.LatLng(maxLat, maxLon));
                    map.fitBounds(tmpB);
                }
            }

        }, {query: textField.val()});
    };

    // reverse geocoding
    var iconObject = L.icon({
        iconUrl: './img/marker-icon.png',
        shadowSize: [50, 64],
        shadowAnchor: [4, 62],
        iconAnchor: [12, 40],
        popupAnchor: new L.Point(0, -33),
    });
    map.on('click', function (e) {
        clearGeocoding();

        ghGeocoding.doRequest(function (json) {
            if (json.message) {
                $("#geocoding-error").text("An error occured: " + json.message);
            } else {
                var counter = 0;
                for (var hitIdx in json.hits) {
                    counter++;
                    var hit = json.hits[hitIdx];
                    var str = counter + ". " + dataToText(hit);
                    L.marker(hit.point, {icon: iconObject}).addTo(geocodingLayer).bindPopup(str).openPopup();

                    // only show first result for now
                    break;
                }
            }
        }, {point: e.latlng.lat + "," + e.latlng.lng});
    });

    var textField = $("#geocoding_text_field");
    textField.keypress(function (e) {
        if (e.which === 13) {
            mysubmit();
            return false;
        }
    });

    $("#geocoding_search_button").click(mysubmit);

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

function setupIsochrone(map, ghIsochrone) {
    map.setView([37.44, -122.16], 12);
    var isochroneLayer;
    var inprogress = false;

    map.on('click', function (e) {
        var callback = function (json) {
            if (isochroneLayer)
                isochroneLayer.clearLayers();

            isochroneLayer = L.geoJson(json.polygons, {
                style: function (feature) {
                    var num = feature.properties.bucket;
                    var color = (num % 2 === 0) ? "#00cc33" : "blue";
                    return {color: color, "weight": num + 2, "opacity": 0.6};
                }
            });

            map.addLayer(isochroneLayer);

            $('#isochrone-response').text("Calculation done");
            inprogress = false;
        };
        var pointStr = e.latlng.lat + "," + e.latlng.lng;

        if (!inprogress) {
            inprogress = true;
            $('#isochrone-response').text("Calculating ...");
            ghIsochrone.doRequest(callback, {point: pointStr, buckets: 2});
        } else {
            $('#isochrone-response').text("Please wait. Calculation in progress ...");
        }
    });
}

function createMap(divId) {
    var osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    var omniscale = L.tileLayer.wms('https://maps.omniscale.net/v1/ghexamples-3646a190/tile', {
        layers: 'osm',
        attribution: osmAttr + ', &copy; <a href="http://maps.omniscale.com/">Omniscale</a>'
    });

    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: osmAttr
    });

    var map = L.map(divId, {layers: [omniscale]});
    L.control.layers({
        "Omniscale": omniscale,
        "OpenStreetMap": osm}).addTo(map);
    return map;
}

function setupMapMatching(map, mmClient) {
    map.setView([50.9, 13.4], 9);
    var routeLayer = L.geoJson().addTo(map);
    routeLayer.options = {
        // use style provided by the 'properties' entry of the geojson added by addDataToRoutingLayer
        style: function (feature) {
            return feature.properties && feature.properties.style;
        }};

    function mybind(key, url, vehicle) {
        $("#" + key).click(function (event) {
            $("#map-matching-response").text("downloading file ...");
            $.get(url, function (content) {
                var dom = (new DOMParser()).parseFromString(content, 'text/xml');
                var pathOriginal = toGeoJSON.gpx(dom);
                routeLayer.clearLayers();
                pathOriginal.features[0].properties = {style: {color: "black", weight: 2, opacity: 0.9}};
                routeLayer.addData(pathOriginal);
                $("#map-matching-response").text("send file ...");
                $("#map-matching-error").text("");
                if (!vehicle)
                    vehicle = "car";
                mmClient.vehicle = vehicle;
                mmClient.doRequest(content, function (json) {
                    if (json.message) {
                        $("#map-matching-response").text("");
                        $("#map-matching-error").text(json.message);
                    } else if (json.paths && json.paths.length > 0) {
                        $("#map-matching-response").text("calculated map matching");
                        var matchedPath = json.paths[0];
                        var geojsonFeature = {
                            type: "Feature",
                            geometry: matchedPath.points,
                            properties: {style: {color: "#00cc33", weight: 6, opacity: 0.4}}
                        };
                        routeLayer.addData(geojsonFeature);
                        if (matchedPath.bbox) {
                            var minLon = matchedPath.bbox[0];
                            var minLat = matchedPath.bbox[1];
                            var maxLon = matchedPath.bbox[2];
                            var maxLat = matchedPath.bbox[3];
                            var tmpB = new L.LatLngBounds(new L.LatLng(minLat, minLon), new L.LatLng(maxLat, maxLon));
                            map.fitBounds(tmpB);
                        }
                    } else {
                        console.log(json);
                        $("#map-matching-error").text("unknown error");
                    }
                });//doRequest
            });// get
        });//click
    }

    var host = "https://raw.githubusercontent.com/graphhopper/directions-api-js-client/master/map-matching-examples";
    mybind("bike_example1", host + "/bike.gpx", "bike");
    mybind("car_example1", host + "/car.gpx", "car");
}
