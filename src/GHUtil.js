let GHUtil = function () {
};

GHUtil.prototype.clone = function (obj) {
    let newObj = {};
    for (let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            newObj[prop] = obj[prop];
        }
    }
    return newObj;
};

GHUtil.prototype.decodePath = function (encoded, is3D) {
    let len = encoded.length;
    let index = 0;
    let array = [];
    let lat = 0;
    let lng = 0;
    let ele = 0;

    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += deltaLat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let deltaLon = ((result & 1) ? ~(result >> 1) : (result >> 1));
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
            let deltaEle = ((result & 1) ? ~(result >> 1) : (result >> 1));
            ele += deltaEle;
            array.push([lng * 1e-5, lat * 1e-5, ele / 100]);
        } else
            array.push([lng * 1e-5, lat * 1e-5]);
    }
    // let end = new Date().getTime();
    // console.log("decoded " + len + " coordinates in " + ((end - start) / 1000) + "s");
    return array;
};

GHUtil.prototype.extractError = function (res, url) {
    let msg;

    if (res && res.data) {
        msg = res.data;
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
    let stringValue = Object.prototype.toString.call(value);
    return (stringValue.toLowerCase() === "[object array]");
};

GHUtil.prototype.isObject = function (value) {
    let stringValue = Object.prototype.toString.call(value);
    return (stringValue.toLowerCase() === "[object object]");
};

GHUtil.prototype.isString = function (value) {
    return (typeof value === 'string');
};

module.exports = GHUtil;