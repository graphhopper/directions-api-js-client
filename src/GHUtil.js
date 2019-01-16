var GHUtil = function () {
};

GHUtil.prototype.clone = function (obj) {
    var newObj = {};
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            newObj[prop] = obj[prop];
        }
    }
    return newObj;
};

GHUtil.prototype.copyProperties = function (args, argsInto) {
    if (!args)
        return argsInto;

    for (var prop in args) {
        if (args.hasOwnProperty(prop) && args[prop] !== undefined) {
            argsInto[prop] = args[prop];
        }
    }

    return argsInto;
};

GHUtil.prototype.decodePath = function (encoded, is3D) {
    var len = encoded.length;
    var index = 0;
    var array = [];
    var lat = 0;
    var lng = 0;
    var ele = 0;

    while (index < len) {
        var b;
        var shift = 0;
        var result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += deltaLat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var deltaLon = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += deltaLon;

        if (is3D) {
            // elevation
            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var deltaEle = ((result & 1) ? ~(result >> 1) : (result >> 1));
            ele += deltaEle;
            array.push([lng * 1e-5, lat * 1e-5, ele / 100]);
        } else
            array.push([lng * 1e-5, lat * 1e-5]);
    }
    // var end = new Date().getTime();
    // console.log("decoded " + len + " coordinates in " + ((end - start) / 1000) + "s");
    return array;
};

GHUtil.prototype.extractError = function (res, url) {
    var msg;

    if (res && res.body) {
        msg = res.body;
        if (msg.hints && msg.hints[0] && msg.hints[0].message)
            msg = msg.hints[0].message;
        else if (msg.message)
            msg = msg.message;
    } else {
        msg = res;
    }

    return new Error(msg + " - for url " + url);
};

GHUtil.prototype.isArray = function (value) {
    var stringValue = Object.prototype.toString.call(value);
    return (stringValue.toLowerCase() === "[object array]");
};

GHUtil.prototype.isObject = function (value) {
    var stringValue = Object.prototype.toString.call(value);
    return (stringValue.toLowerCase() === "[object object]");
};

GHUtil.prototype.isString = function (value) {
    return (typeof value === 'string');
};

module.exports = GHUtil;