GraphHopperOptimization = function (args) {
    this.points = [];
    this.host = "https://graphhopper.com/api/1";
    this.key = args.key;
    this.profile = args.profile;
    this.basePath = '/vrp';

    graphhopper.util.copyProperties(args, this);
};

GraphHopperOptimization.prototype.addPoint = function (input) {
    this.points.push(input);
};

GraphHopperOptimization.prototype.clear = function () {
    this.points.length = 0;
};

GraphHopperOptimization.prototype.doTSPRequest = function (callback) {
    var that = this;
    var firstPoint = that.points[0];
    var servicesArray = [];
    for (var pointIndex in that.points) {
        if (pointIndex < 1)
            continue;
        var point = that.points[pointIndex];
        var obj = {
            "id": "s" + pointIndex,
            "type": "pickup",
            "name": "maintenance " + pointIndex,
            "address": {
                "location_id": "location_" + pointIndex,
                "lon": point.lng,
                "lat": point.lat
            }
        };
        servicesArray.push(obj);
    }

    var jsonInput = {
        "vehicles": [{
                "vehicle_id": "traveling_salesman",
                "start_address": {
                    "location_id": "ts_start_location",
                    "lon": firstPoint.lng,
                    "lat": firstPoint.lat
                },
                "type_id": "tsp_type_1"
            }],
        "vehicle_types": [{
                "type_id": "tsp_type_1",
                "profile": this.profile,
                "distance_dependent_costs": 1.0,
                "time_dependent_costs": 0.0
            }],
        "services": servicesArray

    };
    console.log(jsonInput);

    that.doRequest(jsonInput, callback);
};

GraphHopperOptimization.prototype.doRequest = function (jsonInput, callback, reqArgs) {
    var that = this;
    var args = graphhopper.util.clone(that);
    if (reqArgs)
        args = graphhopper.util.copyProperties(reqArgs, args);

    var url = args.host + args.basePath + "/optimize?key=" + args.key;

    var locationMap = {};
    for (var serviceIndex = 0; serviceIndex < jsonInput.services.length; serviceIndex++) {
        var service = jsonInput.services[serviceIndex];
        locationMap[service.address.location_id] = service.address;
    }

    for (var serviceIndex = 0; serviceIndex < jsonInput.vehicles.length; serviceIndex++) {
        var vehicle = jsonInput.vehicles[serviceIndex];
        if (vehicle.start_address)
            locationMap[vehicle.start_address.location_id] = vehicle.start_address;

        if (vehicle.end_address)
            locationMap[vehicle.end_address.location_id] = vehicle.end_address;
    }

    $.ajax({
        timeout: 5000,
        url: url,
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(jsonInput),
        dataType: "json",
        crossDomain: true
    }).done(function (data) {
        var solutionUrl = args.host + args.basePath + "/solution/" + data.job_id + "?key=" + args.key;

        var timerRet = setInterval(function () {

            console.log("poll solution " + solutionUrl);
            $.ajax({
                timeout: 5000,
                url: solutionUrl,
                type: "GET",
                dataType: "json",
                crossDomain: true
            }).done(function (json) {
                console.log(json);
                if (json.status === "finished") {
                    console.log("finished");
                    clearInterval(timerRet);
                    if (json.solution) {
                        var sol = json.solution;
                        for (var routeIndex = 0; routeIndex < sol.routes.length; routeIndex++) {
                            var route = sol.routes[routeIndex];
                            for (var actIndex = 0; actIndex < route.activities.length; actIndex++) {
                                var act = route.activities[actIndex];
                                act["address"] = locationMap[act.location_id];
                            }
                        }
                    }
                    callback(json);
                }
                else if (json.message) {
                    clearInterval(timerRet);
                    callback(json);
                }
                else if (data === undefined) {
                    clearInterval(timerRet);
                    var json = {
                        "message": "unknown error in calculation for server on " + that.host
                    };
                    callback(json);
                }

            });
        }, 1000);
    }).error(function (resp) {
        // console.log("error: " + JSON.stringify(resp));
        var json = {
            "message": "unknown error - server on " + that.host + " does not respond"
        };
        if (resp.responseJSON)
            json = resp.responseJSON;
        callback(json);
    });
};