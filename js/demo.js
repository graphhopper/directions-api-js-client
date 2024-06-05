let iconObject = L.icon({
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
        let tab = thisDiv.attr("href");
        $(".tab-content").not(tab).css("display", "none");
        $(tab).fadeIn();

        // a bit hackish to refresh the map
        routingMap.invalidateSize(false);
        vrpMap.invalidateSize(false);
        geocodingMap.invalidateSize(false);
        isochroneMap.invalidateSize(false);
        mapMatchingMap.invalidateSize(false);
    }

    let host;// = "http://localhost:9000/api/1";

    //
    // Sign-up for free and get your own key: https://graphhopper.com/#directions-api
    //
    let defaultKey = "9db0a28e-4851-433f-86c7-94b8a695fb18";

    // create a routing client to fetch real routes, elevation.true is only supported for vehicle bike or foot
    let ghRouting = new GraphHopper.Routing({key: defaultKey, host: host}, {elevation: false});
    let ghGeocoding = new GraphHopper.Geocoding({key: defaultKey, host: host},
        {limit: 8, locale: "en" /* fr, en, de and it are supported */});
    let ghMatrix = new GraphHopper.Matrix({key: defaultKey, host: host});
    let ghOptimization = new GraphHopper.Optimization({key: defaultKey, host: host});
    let ghIsochrone = new GraphHopper.Isochrone({key: defaultKey, host: host});
    let ghMapMatching = new GraphHopper.MapMatching({key: defaultKey, host: host});

//    if (location.protocol === "file:") {
//        ghOptimization.host = 'http://localhost:9000/api/1';
//        ghOptimization.basePath = '/vrp';
//    }

    let overwriteExistingKey = function () {
        let key = $("#custom_key_input").val();
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

    let routingMap = createMap('routing-map');
    setupRoutingAPI(routingMap, ghRouting);

    let vrpMap = createMap('vrp-map');
    setupRouteOptimizationAPI(vrpMap, ghOptimization, ghRouting);

    let geocodingMap = createMap('geocoding-map');
    setupGeocodingAPI(geocodingMap, ghGeocoding);

    setupMatrixAPI(ghMatrix);

    let isochroneMap = createMap('isochrone-map');
    setupIsochrone(isochroneMap, ghIsochrone);

    let mapMatchingMap = createMap('map-matching-map');
    setupMapMatching(mapMatchingMap, ghMapMatching);

    let tmpTab = window.location.hash;
    if (!tmpTab)
        tmpTab = "#routing";

    showTab($(".tabs-menu li > a[href='" + tmpTab + "']"));
});

function setupRoutingAPI(map, ghRouting) {
    map.setView([52.521235, 13.3992], 12);

    let points = []
    let instructionsDiv = $("#instructions");
    map.on('click', function (e) {
        if (points.length > 1) {
            points.length = 0;
            routingLayer.clearLayers();
        }

        L.marker(e.latlng, {icon: iconObject}).addTo(routingLayer);

        points.push([e.latlng.lng, e.latlng.lat]);
        if (points.length > 1) {
            // ******************
            //  Calculate route! 
            // ******************
            ghRouting.doRequest({points: points})
                .then(function (json) {
                    let path = json.paths[0];
                    routingLayer.addData({
                        "type": "Feature",
                        "geometry": path.points
                    });
                    let outHtml = "Distance in meter:" + path.distance;
                    outHtml += "<br/>Times in seconds:" + path.time / 1000;
                    $("#routing-response").html(outHtml);

                    if (path.bbox) {
                        let minLon = path.bbox[0];
                        let minLat = path.bbox[1];
                        let maxLon = path.bbox[2];
                        let maxLat = path.bbox[3];
                        let tmpB = new L.LatLngBounds(new L.LatLng(minLat, minLon), new L.LatLng(maxLat, maxLon));
                        map.fitBounds(tmpB);
                    }

                    instructionsDiv.empty();
                    if (path.instructions) {
                        let allPoints = path.points.coordinates;
                        let listUL = $("<ol>");
                        instructionsDiv.append(listUL);
                        for (let idx in path.instructions) {
                            let instr = path.instructions[idx];

                            // use 'interval' to find the geometry (list of points) until the next instruction
                            let instruction_points = allPoints.slice(instr.interval[0], instr.interval[1]);

                            // use 'sign' to display e.g. equally named images

                            $("<li>" + instr.text + " <small>(" + ghRouting.getTurnText(instr.sign) + ")</small>"
                                + " for " + instr.distance + "m and " + Math.round(instr.time / 1000) + "sec"
                                + ", geometry points:" + instruction_points.length + "</li>").appendTo(listUL);
                        }
                    }

                })
                .catch(function (err) {
                    let str = "An error occured: " + err.message;
                    $("#routing-response").text(str);
                });
        }
    });

    let instructionsHeader = $("#instructions-header");
    instructionsHeader.click(function () {
        instructionsDiv.toggle();
    });

    let routingLayer = L.geoJson().addTo(map);
    routingLayer.options = {
        style: {color: "#00cc33", "weight": 5, "opacity": 0.6}
    };
}

function setupRouteOptimizationAPI(map, ghOptimization, ghRouting) {
    map.setView([51.505, -0.09], 13);
    let optPoints = [];

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
            let div = document.createElement('div');
            let img = this._createImg(this.options['iconUrl']);
            let numdiv = document.createElement('div');
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

    let addPointToMap = function (lat, lng, index) {
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
        addPointToMap(e.latlng.lat, e.latlng.lng, optPoints.length);
        optPoints.push([e.latlng.lng, e.latlng.lat]);
    });

    let routingLayer = L.geoJson().addTo(map);
    routingLayer.options.style = function (feature) {
        return feature.properties && feature.properties.style;
    };

    let routePoints = [];

    let clearMap = function () {
        optPoints.length = 0;
        routingLayer.clearLayers();
        routePoints.length = 0;
        $("#vrp-response").empty();
        $("#vrp-error").empty();
    };

    let createSignupSteps = function () {
        return "<div style='color:black'>To test this example <br/>"
            + "1. <a href='https://graphhopper.com/#directions-api'>sign up for free</a>,<br/>"
            + "2. log in and request a free standard package then <br/>"
            + "3. copy the API key to the text field in the upper right corner<div>";
    };

    let getRouteStyle = function (routeIndex) {
        let routeStyle;
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
        return routeStyle;
    };

    let createGHCallback = function (routeStyle) {
        return function (json) {
            for (let pathIndex = 0; pathIndex < json.paths.length; pathIndex++) {
                let path = json.paths[pathIndex];
                routingLayer.addData({
                    "type": "Feature",
                    "geometry": path.points,
                    "properties": {
                        style: routeStyle
                    }
                });
            }
        };
    };

    let optimizeError = function (err) {
        $("#vrp-response").text(" ");

        if (err.message.indexOf("Too many locations") >= 0) {
            $("#vrp-error").empty();
            $("#vrp-error").append(createSignupSteps());
        } else {
            $("#vrp-error").text("An error occured: " + err.message);
        }
        console.error(err);
    };

    let optimizeResponse = function (json) {
        let sol = json.solution;
        if (!sol)
            return;

        $("#vrp-response").text("Solution found for " + sol.routes.length + " vehicle(s)! "
            + "Distance: " + Math.floor(sol.distance / 1000) + "km "
            + ", time: " + Math.floor(sol.time / 60) + "min "
            + ", costs: " + sol.costs);

        let no_unassigned = sol.unassigned.services.length + sol.unassigned.shipments.length;
        if (no_unassigned > 0)
            $("#vrp-error").append("<br/>unassigned jobs: " + no_unassigned);

        routingLayer.clearLayers();
        for (let routeIndex = 0; routeIndex < sol.routes.length; routeIndex++) {
            let route = sol.routes[routeIndex];

            // fetch real routes from graphhopper
            routePoints.length = 0;
            let firstAdd;
            for (let actIndex = 0; actIndex < route.activities.length; actIndex++) {
                let add = route.activities[actIndex].address;
                routePoints.push([add.lon, add.lat]);

                if (!eqAddress(firstAdd, add))
                    addPointToMap(add.lat, add.lon, actIndex);

                if (actIndex === 0)
                    firstAdd = add;
            }

            let ghCallback = createGHCallback(getRouteStyle(routeIndex));

            ghRouting.doRequest({points: routePoints, instructions: false})
                .then(ghCallback)
                .catch(function (err) {
                    let str = "An error for the routing occurred: " + err.message;
                    $("#vrp-error").text(str);
                });
        }
    };

    let eqAddress = function (add1, add2) {
        return add1 && add2
            && Math.floor(add1.lat * 1000000) === Math.floor(add2.lat * 1000000)
            && Math.floor(add1.lon * 1000000) === Math.floor(add2.lon * 1000000);
    };

    let optimizeRoute = function () {
        if (optPoints.length < 3) {
            $("#vrp-response").text("At least 3 points required but was: " + optPoints.length);
            return;
        }
        $("#vrp-response").text("Calculating ...");
        ghOptimization.doVRPRequest(optPoints, $("#optimize_vehicles").val())
            .then(optimizeResponse)
            .catch(optimizeError);
    };

    $("#vrp_clear_button").click(clearMap);

    // Increase version if one of the examples change, see #2
    let exampleVersion = 2;

    $("#set_example_vrp").click(function () {
        $.getJSON("route-optimization-examples/vrp_lonlat_new.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData)
                .then(optimizeResponse)
                .catch(optimizeError);
        });
    });

    $("#set_example_tsp").click(function () {
        $.getJSON("route-optimization-examples/tsp_lonlat_new.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData)
                .then(optimizeResponse)
                .catch(optimizeError);
        });
    });

    $("#set_example_tsp2").click(function () {
        $.getJSON("route-optimization-examples/tsp_lonlat_end.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData)
                .then(optimizeResponse)
                .catch(optimizeError);
        });
    });

    $("#set_example_us_tour").click(function () {
        $.getJSON("route-optimization-examples/american_road_trip.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([38.754083, -101.074219], 4);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData)
                .then(optimizeResponse)
                .catch(optimizeError);
        });
    });

    $("#set_example_uk_tour").click(function () {
        $.getJSON("route-optimization-examples/uk50.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([54.136696, -4.592285], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData)
                .then(optimizeResponse)
                .catch(optimizeError);
        });
    });

    $("#optimize_button").click(optimizeRoute);
}

function setupGeocodingAPI(map, ghGeocoding) {
    //  Find address    
    map.setView([51.505, -0.09], 13);
    let iconObject = L.icon({
        iconUrl: './img/marker-icon.png',
        shadowSize: [50, 64],
        shadowAnchor: [4, 62],
        iconAnchor: [12, 40]
    });
    let geocodingLayer = L.geoJson().addTo(map);
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
            let div = document.createElement('div');
            let img = this._createImg(this.options['iconUrl']);
            let numdiv = document.createElement('div');
            numdiv.setAttribute("class", "number");
            numdiv.innerHTML = this.options['number'] || '';
            div.appendChild(img);
            div.appendChild(numdiv);
            this._setIconStyles(div, 'icon');
            return div;
        }
    });

    let clearGeocoding = function () {
        $("#geocoding-results").empty();
        $("#geocoding-error").empty();
        $("#geocoding-response").empty();
        geocodingLayer.clearLayers();
    };

    let mysubmit = function () {
        clearGeocoding();

        ghGeocoding.doRequest({query: textField.val()})
            .then(function (json) {
                let listUL = $("<ol>");
                $("#geocoding-response").append("Locale:" + ghGeocoding.locale + "<br/>").append(listUL);
                let minLon, minLat, maxLon, maxLat;
                let counter = 0;
                for (let hitIdx in json.hits) {
                    counter++;
                    let hit = json.hits[hitIdx];

                    let str = counter + ". " + dataToText(hit);
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
                    let tmpB = new L.LatLngBounds(new L.LatLng(minLat, minLon), new L.LatLng(maxLat, maxLon));
                    map.fitBounds(tmpB);
                }
            })
            .catch(function (err) {
                $("#geocoding-error").text("An error occured: " + err.message);
            });
    };

    // reverse geocoding
    iconObject = L.icon({
        iconUrl: './img/marker-icon.png',
        shadowSize: [50, 64],
        shadowAnchor: [4, 62],
        iconAnchor: [12, 40],
        popupAnchor: new L.Point(0, -33),
    });
    map.on('click', function (e) {
        clearGeocoding();

        ghGeocoding.doRequest({point: e.latlng.lat + "," + e.latlng.lng})
            .then(function (json) {
                let counter = 0;
                for (let hitIdx in json.hits) {
                    counter++;
                    let hit = json.hits[hitIdx];
                    let str = counter + ". " + dataToText(hit);
                    L.marker(hit.point, {icon: iconObject}).addTo(geocodingLayer).bindPopup(str).openPopup();

                    // only show first result for now
                    break;
                }
            })
            .catch(function (err) {
                $("#geocoding-error").text("An error occured: " + err.message);
            });
    });

    let textField = $("#geocoding_text_field");
    textField.keypress(function (e) {
        if (e.which === 13) {
            mysubmit();
            return false;
        }
    });

    $("#geocoding_search_button").click(mysubmit);

    function dataToText(data) {
        let text = "";
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
        let request = {"out_arrays": ["distances", "times"]}
        request.points = []
        $('.point').each(function (idx, div) {
            // parse the input strings and adds it as from_point and to_point
            let str = $(div).val()
            var index = str.indexOf(",");
            if (index >= 0) {
                let lat = parseFloat(str.substr(0, index)),
                    lng = parseFloat(str.substr(index + 1));
                request.points.push([lng, lat]);
            }

            // To create an NxM matrix you can simply use the other methods e.g.
            // ghm.addFromPoint(new GHInput(someCoordinateString))
            // or
            // ghm.addToPoint(new GHInput(someCoordinateString))
        });

        $("#matrix-error").empty();
        $("#matrix-response").empty();

        ghMatrix.doRequest(request)
            .then(function (json) {
                let outHtml = "Distances in meters: <br/>" + ghMatrix.toHtmlTable(request, json.distances);
                outHtml += "<br/><br/>Times in seconds: <br/>" + ghMatrix.toHtmlTable(request, json.times);
                $("#matrix-response").html(outHtml);
            })
            .catch(function (err) {
                let str = "An error occured: " + err.message;
                $("#matrix-error").text(str);
            });

        return false;
    });
}

function setupIsochrone(map, ghIsochrone) {
    map.setView([37.44, -122.16], 12);
    let isochroneLayer;
    let inprogress = false;

    map.on('click', function (e) {
        let pointStr = e.latlng.lat + "," + e.latlng.lng;

        if (!inprogress) {
            inprogress = true;
            $('#isochrone-response').text("Calculating ...");
            ghIsochrone.doRequest({point: pointStr, buckets: 2})
                .then(function (json) {
                    if (isochroneLayer)
                        isochroneLayer.clearLayers();

                    isochroneLayer = L.geoJson(json.polygons, {
                        style: function (feature) {
                            let num = feature.properties.bucket;
                            let color = (num % 2 === 0) ? "#00cc33" : "blue";
                            return {color: color, "weight": num + 2, "opacity": 0.6};
                        }
                    });

                    map.addLayer(isochroneLayer);

                    $('#isochrone-response').text("Calculation done");
                    inprogress = false;
                })
                .catch(function (err) {
                    inprogress = false;
                    $('#isochrone-response').text("An error occured: " + err.message);
                })
            ;
        } else {
            $('#isochrone-response').text("Please wait. Calculation in progress ...");
        }
    });
}

function createMap(divId) {
    let osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: osmAttr
    });

    let map = L.map(divId, {layers: [osm]});
    L.control.layers({
        "OpenStreetMap": osm
    }).addTo(map);
    return map;
}

function setupMapMatching(map, mmClient) {
    map.setView([50.9, 13.4], 9);
    let routeLayer = L.geoJson().addTo(map);
    routeLayer.options = {
        // use style provided by the 'properties' entry of the geojson added by addDataToRoutingLayer
        style: function (feature) {
            return feature.properties && feature.properties.style;
        }
    };

    function mybind(key, url, profile) {
        $("#" + key).click(event => {
            $("#" + key).prop('disabled', true);
            $("#map-matching-response").text("downloading file ...");
            fetch(url).then(response => {
                response.text().then((content) => {
                    let dom = (new DOMParser()).parseFromString(content, 'text/xml');
                    let pathOriginal = toGeoJSON.gpx(dom);
                    routeLayer.clearLayers();
                    pathOriginal.features[0].properties = {style: {color: "black", weight: 2, opacity: 0.9}};
                    routeLayer.addData(pathOriginal);
                    $("#map-matching-response").text("send file ...");
                    $("#map-matching-error").text("");
                    mmClient.doRequest(content, {profile: profile})
                        .then(function (json) {
                            $("#map-matching-response").text("calculated map matching for " + profile);
                            let matchedPath = json.paths[0];
                            let geojsonFeature = {
                                type: "Feature",
                                geometry: matchedPath.points,
                                properties: {style: {color: "#00cc33", weight: 6, opacity: 0.4}}
                            };
                            routeLayer.addData(geojsonFeature);
                            if (matchedPath.bbox) {
                                let minLon = matchedPath.bbox[0];
                                let minLat = matchedPath.bbox[1];
                                let maxLon = matchedPath.bbox[2];
                                let maxLat = matchedPath.bbox[3];
                                let tmpB = new L.LatLngBounds(new L.LatLng(minLat, minLon), new L.LatLng(maxLat, maxLon));
                                map.fitBounds(tmpB);
                            }
                            $("#" + key).prop('disabled', false);
                        })
                        .catch(function (err) {
                            $("#map-matching-response").text("");
                            $("#map-matching-error").text(err.message);
                            $("#" + key).prop('disabled', false);
                        });//doRequest
                })// get
            })
        });//click
    }

    mybind("bike_example1", "/map-matching-examples/bike.gpx", "bike");
    mybind("car_example1", "/map-matching-examples/car.gpx", "car");
}
