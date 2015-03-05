$(document).ready(function (e) {
    jQuery.support.cors = true;

    var args = {key: "YOUR_KEY",
        limit: 8,
        // currently fr, en, de and it are explicitely supported
        locale: "en"};

    var ghGeocoding = new GraphHopperGeocoding(args);

    // ******************
    //  Find address! 
    // ******************
    var textField = $("#text_field");
    $("#search_button").click(function () {
        ghGeocoding.doRequest(function (json) {

            $("#results").empty();

            if (json.info && json.info.errors) {
                $("#message").text("An error occured: " + json.info.errors[0].message);
            } else {
                var listUL = $("<ol>");
                $("#results").append(listUL);
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
});