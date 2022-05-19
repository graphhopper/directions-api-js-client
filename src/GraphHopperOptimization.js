let request = require('axios');

let GHUtil = require("./GHUtil");
let ghUtil = new GHUtil();

GraphHopperOptimization = function (args) {
    this.key = args.key;
    this.host = args.host ? args.host : "https://graphhopper.com/api/1";
    this.endpoint = args.endpoint ? args.endpoint : '/vrp';
    this.timeout = args.timeout ? args.timeout : 10000;
    this.waitInMillis = args.waitInMillis ? args.waitInMillis : 1000;
    this.postTimeout = args.postTimeout ? args.postTimeout : 10000;
};

GraphHopperOptimization.prototype.doVRPRequest = function (points, vehicles) {
    let that = this;

    let firstPoint = points[0];
    let servicesArray = [];
    for (let pointIndex in points) {
        if (pointIndex < 1)
            continue;
        let point = points[pointIndex];
        let obj = {
            "id": "_" + pointIndex,
            "type": "pickup",
            "name": "maintenance " + pointIndex,
            "address": {
                "location_id": "_location_" + pointIndex,
                "lon": point[0],
                "lat": point[1]
            }
        };
        servicesArray.push(obj);
    }

    let list = [];
    for (let i = 0; i < vehicles; i++) {
        list.push({
            "vehicle_id": "_vehicle_" + i,
            "start_address": {
                "location_id": "_start_location",
                "lon": firstPoint[0],
                "lat": firstPoint[1]
            },
            "type_id": "_vtype_1"
        });
    }

    let jsonInput = {
        "algorithm": {
            "problem_type": "min-max"
        },
        "vehicles": list,
        "vehicle_types": [{
            "type_id": "_vtype_1",
            "profile": "car"
        }],
        "services": servicesArray

    };
    //console.log(jsonInput);

    return that.doRequest(jsonInput);
};

GraphHopperOptimization.prototype.doRawRequest = function (jsonInput) {
    let that = this;

    return new Promise(function (resolve, reject) {
        let postURL = that.host + that.endpoint + "/optimize?key=" + that.key;
        request.post(postURL, jsonInput, {
            timeout: that.postTimeout,
            headers: {'Content-Type': 'application/json'}
        })
            .then(res => {
                if (res.status !== 200) {
                    reject(ghUtil.extractError(res, postURL));
                } else if (res) {
                    let solutionUrl = that.host + that.endpoint + "/solution/" + res.data.job_id + "?key=" + that.key;
                    let timerRet;

                    let pollTrigger = function () {
                        // console.log("poll solution " + solutionUrl);
                        request.get(solutionUrl, {timeout: that.timeout})
                            .then(res => {
                                if (res.status !== 200 || res.data === undefined) {
                                    clearInterval(timerRet);
                                    reject(ghUtil.extractError(res, solutionUrl));
                                } else if (res) {
                                    //console.log(res.body);
                                    if (res.data.status === "finished") {
                                        //console.log("finished");
                                        clearInterval(timerRet);
                                        resolve(res.data);
                                    } else if (res.data.message) {
                                        clearInterval(timerRet);
                                        resolve(res.data);
                                    }
                                }
                            });
                    };

                    if (that.waitInMillis > 0)
                        timerRet = setInterval(pollTrigger, that.waitInMillis);
                    else
                        pollTrigger();

                }
            })
            .catch(err => {
                reject(ghUtil.extractError(err.response, postURL));
            });
    });
};

GraphHopperOptimization.prototype.doRequest = function (jsonInput) {
    let vehicleTypeProfileMap = {};
    let vehicleTypeMap = {};
    let vehicleProfileMap = {};
    let serviceMap = {};
    let shipmentMap = {};
    let locationMap = {};
    let hasGeometries = false;
    let hasCustomCostMatrix = false;

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
        for (let typeIndex = 0; typeIndex < jsonInput.vehicle_types.length; typeIndex++) {
            let type = jsonInput.vehicle_types[typeIndex];
            vehicleTypeProfileMap[type.type_id] = type.profile;
            vehicleTypeMap[type.type_id] = type;
        }
    }

    if (jsonInput.services) {
        for (let serviceIndex = 0; serviceIndex < jsonInput.services.length; serviceIndex++) {
            let service = jsonInput.services[serviceIndex];
            locationMap[service.address.location_id] = service.address;
            serviceMap[service.id] = service;
        }
    }

    if (jsonInput.shipments) {
        for (let shipmentIndex = 0; shipmentIndex < jsonInput.shipments.length; shipmentIndex++) {
            let shipment = jsonInput.shipments[shipmentIndex];
            locationMap[shipment.pickup.address.location_id] = shipment.pickup.address;
            locationMap[shipment.delivery.address.location_id] = shipment.delivery.address;
            shipmentMap[shipment.id] = shipment;
        }
    }

    let breakMap = {};
    let vehicleMap = {};
    if (jsonInput.vehicles) {
        for (let vehicleIndex = 0; vehicleIndex < jsonInput.vehicles.length; vehicleIndex++) {
            let vehicle = jsonInput.vehicles[vehicleIndex];
            vehicleMap[vehicle.vehicle_id] = vehicle;
            let profile = null;
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
                let break_id = vehicle.vehicle_id + "_break";
                breakMap[break_id] = vehicle.break;
            }
        }
    }

    let promise = this.doRawRequest(jsonInput);
    promise.then(function (json) {
        if (json.solution) {
            let sol = json.solution;
            json.raw_solution = JSON.parse(JSON.stringify(sol));
            sol["calc_points"] = hasGeometries;
            for (let routeIndex = 0; routeIndex < sol.routes.length; routeIndex++) {
                let route = sol.routes[routeIndex];
                let vehicleId = route.vehicle_id;
                let profile = vehicleProfileMap[vehicleId];
                route["profile"] = profile;
                for (let actIndex = 0; actIndex < route.activities.length; actIndex++) {
                    let act = route.activities[actIndex];
                    act["address"] = locationMap[act.location_id];
                    if (act.id) {
                        let driverBreak = breakMap[act.id];
                        // console.log(act.id + " " + driverBreak);
                        if (driverBreak) {
                            act["break"] = breakMap[act.id];
                        } else if (serviceMap[act.id]) {
                            act["service"] = serviceMap[act.id];
                        } else if (shipmentMap[act.id]) {
                            act["shipment"] = shipmentMap[act.id];
                        }
                    } else {
                        let vehicle = vehicleMap[vehicleId];
                        act["vehicle"] = vehicle;
                        act["vehicle_type"] = vehicleTypeMap[vehicle.type_id];
                    }
                }
            }
            let unassignedServices = new Array();
            for (let i = 0; i < sol.unassigned.services.length; i++) {
                let serviceId = sol.unassigned.services[i];
                unassignedServices.push(serviceMap[serviceId]);
                unassignedServices.push(serviceMap[serviceId]);
            }
            sol["unassigned_services"] = unassignedServices;

            let unassignedShipments = new Array();
            for (let i = 0; i < sol.unassigned.shipments.length; i++) {
                let shipmentId = sol.unassigned.shipments[i];
                unassignedShipments.push(shipmentMap[shipmentId]);
            }
            sol["unassigned_shipments"] = unassignedShipments;
        }
        return json;
    });
    return promise;

};

module.exports = GraphHopperOptimization;