GraphHopperOptimization = function (args) {
    this.points = [];
    this.host = "https://graphhopper.com/api/1";
    this.key = args.key;
    this.profile = args.profile;
    this.basePath = '/vrp';
    this.waitInMillis = 1000;
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
                "profile": this.profile
            }],
        "services": servicesArray

    };
    console.log(jsonInput);

    that.doRequest(jsonInput, callback);
};

GraphHopperOptimization.prototype.doRawRequest = function (jsonInput, callback, reqArgs) {
    var that = this;
    var args = graphhopper.util.clone(that);
    if (reqArgs)
        args = graphhopper.util.copyProperties(reqArgs, args);

    var url = args.host + args.basePath + "/optimize?key=" + args.key;

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
        var timerRet;

        var pollTrigger = function () {
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
        };

        if (that.waitInMillis > 0)
            timerRet = setInterval(pollTrigger, that.waitInMillis);
        else
            pollTrigger();

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

GraphHopperOptimization.prototype.doRequest = function (jsonInput, callback, reqArgs) {

    var vehicleTypeMap = {};
    if(jsonInput.vehicle_types) {
        for (var typeIndex = 0; typeIndex < jsonInput.vehicle_types.length; typeIndex++) {
            var type = jsonInput.vehicle_types[typeIndex];
            vehicleTypeMap[type.type_id] = type.profile;
        }
    }

    var vehicleProfileMap = {};
    var serviceMap = {};
    var shipmentMap = {};
    var locationMap = {};

    if(jsonInput.services != null){
    for (var serviceIndex = 0; serviceIndex < jsonInput.services.length; serviceIndex++) {
        var service = jsonInput.services[serviceIndex];
        locationMap[service.address.location_id] = service.address;
        serviceMap[service.id] = service;
    }
    }

    if(jsonInput.shipments != null) {
        for (var shipmentIndex = 0; shipmentIndex < jsonInput.shipments.length; shipmentIndex++) {
            var shipment = jsonInput.shipments[shipmentIndex];
            locationMap[shipment.pickup.address.location_id] = shipment.pickup.address;
            locationMap[shipment.delivery.address.location_id] = shipment.delivery.address;
            shipmentMap[shipment.id] = shipment;
        }
    }

    for (var vehicleIndex = 0; vehicleIndex < jsonInput.vehicles.length; vehicleIndex++) {
        var vehicle = jsonInput.vehicles[vehicleIndex];
        var profile = null;
        if(vehicle.type_id != null){
            profile = vehicleTypeMap[vehicle.type_id];
            if(profile != null){
                vehicleProfileMap[vehicle.vehicle_id] = profile;
            }
            else vehicleProfileMap[vehicle.vehicle_id] = "car";
        }
        else vehicleProfileMap[vehicle.vehicle_id] = "car";
        if (vehicle.start_address)
            locationMap[vehicle.start_address.location_id] = vehicle.start_address;

        if (vehicle.end_address)
            locationMap[vehicle.end_address.location_id] = vehicle.end_address;
    }

    var tempCallback = function (json) {
        if (json.solution) {
            var sol = json.solution;
            for (var routeIndex = 0; routeIndex < sol.routes.length; routeIndex++) {
                var route = sol.routes[routeIndex];
                var profile = vehicleProfileMap[route.vehicle_id];
                route["profile"] = profile;
                for (var actIndex = 0; actIndex < route.activities.length; actIndex++) {
                    var act = route.activities[actIndex];
                    act["address"] = locationMap[act.location_id];
                }
            }
            var unassignedServices = new Array();
            for(var i=0;i<sol.unassigned.services.length;i++){
                var serviceId = sol.unassigned.services[i];
                unassignedServices.push(serviceMap[serviceId]);
            }
            sol["unassigned_services"] = unassignedServices;

            var unassignedShipments = new Array();
            for(var i=0;i<sol.unassigned.shipments.length;i++){
                var shipmentId = sol.unassigned.shipments[i];
                unassignedShipments.push(shipmentMap[shipmentId]);
            }
            sol["unassigned_shipments"] = unassignedShipments;
        }
        callback(json);
    };

    this.doRawRequest(jsonInput, tempCallback, reqArgs);
};