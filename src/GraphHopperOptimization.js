var request = require('superagent');
var Promise = require("bluebird");

var GHUtil = require("./GHUtil");
var ghUtil = new GHUtil();

GraphHopperOptimization = function (args) {
    this.points = [];
    this.host = "https://graphhopper.com/api/1";
    this.key = args.key;
    this.profile = args.profile;
    this.basePath = '/vrp';
    this.waitInMillis = 1000;
    this.timeout = 10000;
    this.postTimeout = 15000;
    ghUtil.copyProperties(args, this);
};

GraphHopperOptimization.prototype.addPoint = function (input) {
    this.points.push(input);
};

GraphHopperOptimization.prototype.clear = function () {
    this.points.length = 0;
};

GraphHopperOptimization.prototype.doTSPRequest = function () {
    return this.doVRPRequest(1);
};

GraphHopperOptimization.prototype.doVRPRequest = function (vehicles) {
    var that = this;

    var firstPoint = that.points[0];
    var servicesArray = [];
    for (var pointIndex in that.points) {
        if (pointIndex < 1)
            continue;
        var point = that.points[pointIndex];
        var obj = {
            "id": "_" + pointIndex,
            "type": "pickup",
            "name": "maintenance " + pointIndex,
            "address": {
                "location_id": "_location_" + pointIndex,
                "lon": point.lng,
                "lat": point.lat
            }
        };
        servicesArray.push(obj);
    }

    var list = [];
    for (var i = 0; i < vehicles; i++) {
        list.push({
            "vehicle_id": "_vehicle_" + i,
            "start_address": {
                "location_id": "_start_location",
                "lon": firstPoint.lng,
                "lat": firstPoint.lat
            },
            "type_id": "_vtype_1"
        });
    }

    var jsonInput = {
        "algorithm": {
            "problem_type": "min-max"
        },
        "vehicles": list,
        "vehicle_types": [{
                "type_id": "_vtype_1",
                "profile": this.profile
            }],
        "services": servicesArray

    };
    //console.log(jsonInput);

    return that.doRequest(jsonInput);
};

GraphHopperOptimization.prototype.doRawRequest = function (jsonInput, reqArgs) {
    var that = this;

    return new Promise(function (resolve, reject) {
        var args = ghUtil.clone(that);
        if (reqArgs)
            args = ghUtil.copyProperties(reqArgs, args);

        var url = args.host + args.basePath + "/optimize?key=" + args.key;

        request
                .post(url)
                .send(JSON.stringify(jsonInput))
                .accept('application/json; charset=utf-8')
                .type('application/json')
                .timeout(args.postTimeout)
                .end(function (err, res) {
                    if (err || !res.ok) {
                        reject(ghUtil.extractError(res, url));
                    } else if (res) {
                        var solutionUrl = args.host + args.basePath + "/solution/" + res.body.job_id + "?key=" + args.key;
                        var timerRet;

                        var pollTrigger = function () {
                            // console.log("poll solution " + solutionUrl);
                            request
                                    .get(solutionUrl)
                                    .accept('application/json')
                                    .timeout(args.timeout)
                                    .end(function (err, res) {
                                        if (err || !res.ok || res.body === undefined) {
                                            clearInterval(timerRet);
                                            reject(ghUtil.extractError(res, url));
                                        } else if (res) {
                                            //console.log(res.body);
                                            if (res.body.status === "finished") {
                                                //console.log("finished");
                                                clearInterval(timerRet);
                                                resolve(res.body);
                                            } else if (res.body.message) {
                                                clearInterval(timerRet);
                                                resolve(res.body);
                                            }
                                        }
                                    });
                        };

                        if (that.waitInMillis > 0)
                            timerRet = setInterval(pollTrigger, that.waitInMillis);
                        else
                            pollTrigger();

                    }
                });
    });
};

GraphHopperOptimization.prototype.doRequest = function (jsonInput, reqArgs) {

    var vehicleTypeProfileMap = {};
    var vehicleTypeMap = {};
    var vehicleProfileMap = {};
    var serviceMap = {};
    var shipmentMap = {};
    var locationMap = {};
    var hasGeometries = false;
    var hasCustomCostMatrix = false;

    if (jsonInput.cost_matrices && jsonInput.cost_matrices.length > 0)
        hasCustomCostMatrix = true;

    if (jsonInput.configuration && !hasCustomCostMatrix)
        if (jsonInput.configuration.routing.calc_points === true)
            hasGeometries = true;

    if (!hasGeometries) {
        if (!jsonInput.configuration && !hasCustomCostMatrix) {
            jsonInput.configuration = {"routing": {"calc_points": true}};
        }
    }

    if (jsonInput.vehicle_types) {
        for (var typeIndex = 0; typeIndex < jsonInput.vehicle_types.length; typeIndex++) {
            var type = jsonInput.vehicle_types[typeIndex];
            vehicleTypeProfileMap[type.type_id] = type.profile;
            vehicleTypeMap[type.type_id] = type;
        }
    }

    if (jsonInput.services) {
        for (var serviceIndex = 0; serviceIndex < jsonInput.services.length; serviceIndex++) {
            var service = jsonInput.services[serviceIndex];
            locationMap[service.address.location_id] = service.address;
            serviceMap[service.id] = service;
        }
    }

    if (jsonInput.shipments) {
        for (var shipmentIndex = 0; shipmentIndex < jsonInput.shipments.length; shipmentIndex++) {
            var shipment = jsonInput.shipments[shipmentIndex];
            locationMap[shipment.pickup.address.location_id] = shipment.pickup.address;
            locationMap[shipment.delivery.address.location_id] = shipment.delivery.address;
            shipmentMap[shipment.id] = shipment;
        }
    }

    var breakMap = {};
    var vehicleMap = {};
    if (jsonInput.vehicles) {
        for (var vehicleIndex = 0; vehicleIndex < jsonInput.vehicles.length; vehicleIndex++) {
            var vehicle = jsonInput.vehicles[vehicleIndex];
            vehicleMap[vehicle.vehicle_id] = vehicle;
            var profile = null;
            if (vehicle.type_id !== null) {
                profile = vehicleTypeProfileMap[vehicle.type_id];
                if (profile !== null) {
                    vehicleProfileMap[vehicle.vehicle_id] = profile;
                } else {
                    vehicleProfileMap[vehicle.vehicle_id] = "car";
                }
            } else
                vehicleProfileMap[vehicle.vehicle_id] = "car";

            if (vehicle.start_address) {
                locationMap[vehicle.start_address.location_id] = vehicle.start_address;
            }
            if (vehicle.end_address) {
                locationMap[vehicle.end_address.location_id] = vehicle.end_address;
            }
            if (vehicle.break) {
                var break_id = vehicle.vehicle_id + "_break";
                breakMap[break_id] = vehicle.break;
            }
        }
    }

    var promise = this.doRawRequest(jsonInput, reqArgs);
    promise.then(function (json) {
        if (json.solution) {
            var sol = json.solution;
            json.raw_solution = JSON.parse(JSON.stringify(sol));
            sol["calc_points"] = hasGeometries;
            for (var routeIndex = 0; routeIndex < sol.routes.length; routeIndex++) {
                var route = sol.routes[routeIndex];
                var vehicleId = route.vehicle_id;
                var profile = vehicleProfileMap[vehicleId];
                route["profile"] = profile;
                for (var actIndex = 0; actIndex < route.activities.length; actIndex++) {
                    var act = route.activities[actIndex];
                    act["address"] = locationMap[act.location_id];
                    if (act.id) {
                        var driverBreak = breakMap[act.id];
                        // console.log(act.id + " " + driverBreak);
                        if (driverBreak) {
                            act["break"] = breakMap[act.id];
                        } else if (serviceMap[act.id]) {
                            act["service"] = serviceMap[act.id];
                        } else if (shipmentMap[act.id]) {
                            act["shipment"] = shipmentMap[act.id];
                        }
                    } else {
                        var vehicle = vehicleMap[vehicleId];
                        act["vehicle"] = vehicle;
                        act["vehicle_type"] = vehicleTypeMap[vehicle.type_id];
                    }
                }
            }
            var unassignedServices = new Array();
            for (var i = 0; i < sol.unassigned.services.length; i++) {
                var serviceId = sol.unassigned.services[i];
                unassignedServices.push(serviceMap[serviceId]);
            }
            sol["unassigned_services"] = unassignedServices;

            var unassignedShipments = new Array();
            for (var i = 0; i < sol.unassigned.shipments.length; i++) {
                var shipmentId = sol.unassigned.shipments[i];
                unassignedShipments.push(shipmentMap[shipmentId]);
            }
            sol["unassigned_shipments"] = unassignedShipments;
        }
        return json;
    });
    return promise;

};

module.exports = GraphHopperOptimization;