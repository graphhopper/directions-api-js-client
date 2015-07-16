describe("js-client", function () {

    var ghOptimization;
    var fixtures;

    beforeEach(function () {
        // load multiple json fixtures via comma separated
        fixtures = loadJSONFixtures('response1.json');

        jasmine.Ajax.install();
        ghOptimization = new GraphHopperOptimization({key: "defaultKey", profile: "car", waitInMillis: 0});
    });

    it("should parse services correctly", function () {

        var response = {};
        var callback = function (json) {
            response.json = json;
        };

        var jsonInput = {
            "vehicles": [{
                    "vehicle_id": "vehicle1",
                    "start_address": {"location_id": "v1_startLoc", "lon": 9.797058, "lat": 52.375599}
                }],
            "services": [{
                    "id": "b1",
                    "name": "drink_bionade_in_rostock",
                    "address": {"location_id": "loc_b1", "lon": 12.1333333, "lat": 54.0833333}
                }, {
                    "id": "b2",
                    "name": "drink_cola_in_berlin",
                    "address": {"location_id": "loc_b2", "lon": 13.354568, "lat": 52.514549}
                }]
        };

        ghOptimization.doRequest(jsonInput, callback, {});
        request = jasmine.Ajax.requests.mostRecent();

        expect(request.data()).toEqual(jsonInput);
        expect(request.url).toBe('https://graphhopper.com/api/1/vrp/optimize?key=defaultKey');
        expect(request.method).toBe('POST');

        request.respondWith({status: 200, responseText: '{"job_id":"018a5181-d893-4373-a7de-ebdc38617fcb"}'});

        request = jasmine.Ajax.requests.mostRecent();
        expect(request.method).toBe('GET');
        expect(request.url).toBe('https://graphhopper.com/api/1/vrp/solution/018a5181-d893-4373-a7de-ebdc38617fcb?key=defaultKey');

        // answer the GET request with
        request.respondWith({
            status: 200,
            responseText: JSON.stringify(fixtures['response1.json'])
        });

        // which should be transformed correctly from our code into
        var sol = response.json.solution;
        expect(sol.routes.length).toEqual(1);
        expect(sol.routes[0].activities.length).toEqual(4);
        
        // important that address is filled into returned json from input:
        expect(sol.routes[0].activities[0].address).toEqual({location_id: 'v1_startLoc', lon: 9.797058, lat: 52.375599});        
    });
});