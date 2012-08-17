//self.port.emit('resize', {width: document.documentElement.clientWidth,height: document.documentElement.clientHeight});

self.port.on("tosdrpoint", function (dataPoint){
var badge, icon, sign;
    if (dataPoint[1].tosdr.point == 'good') {
        badge = 'badge-success';
        icon = 'thumbs-up';
        sign = '+';
    } else if (dataPoint[1].tosdr.point == 'mediocre') {
        badge = 'badge-warning';
        icon = 'thumbs-down';
        sign = '-';
    } else if (dataPoint[1].tosdr.point == 'alert') {
        badge = 'badge-important';
        icon = 'remove';
        sign = '×';
    } else if (dataPoint[1].tosdr.point == 'not bad') {
        badge = 'badge-neutral';
        icon = 'arrow-right';
        sign = '→';
    } else {
        badge = '';
        icon = 'question-sign';
        sign = '?';
    }
    $('#popup-point-' + dataPoint[0] + '-' + dataPoint[1].id).html(
        '<div class="' + dataPoint[1].tosdr.point + '"><h5><span class="badge ' + badge
            + '" title="' + dataPoint[1].tosdr.point + '"><i class="icon-' + icon + ' icon-white">' + sign + '</i></span> ' + dataPoint[1].name + ' <a href="' + dataPoint[1].discussion + '" target="_blank" class="label context">Discussion</a> <!--a href="' + dataPoint[1].source.terms + '" class="label context" target="_blank">Terms</a--></h5><p>'
            + dataPoint[1].tosdr.tldr + '</p></div></li>');
}); 
        
    function renderDataPoint(service, dataPointId) {
        var renderdata = [];
        renderdata[0] = service;
        renderdata[1] = dataPointId;
        self.port.emit("renderDataPoint", renderdata);           
    }

    var NOT_RATED_TEXT = "We haven't sufficiently reviewed the terms yet. Please contribute to our group: <a target=\"_blank\" href=\"https:\/\/groups.google.com/d/forum/tosdr\">tosdr@googlegroups.com</a>.";
    var RATING_TEXT = {
        0:NOT_RATED_TEXT,
        "false":NOT_RATED_TEXT,
        "A":"The terms of service treat you fairly, respect your rights and follows the best practices.",
        "B":"The terms of services are fair towards the user but they could be improved.",
        "C":"The terms of service are okay but some issues need your consideration.",
        "D":"The terms of service are very uneven or there are some important issues that need your attention.",
        "E":"The terms of service raise very serious concerns."
    };

    function renderPopup(name, service) {
        renderPopupHtml(name, service.name, service.url, service.tosdr.rated, RATING_TEXT[service.tosdr.rated],
            service.points, service.links);
    }

    function isEmpty(map) {
        for (var key in map) {
            if (map.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }

    function renderPopupHtml(name, longName, domain, verdict, ratingText, points, links) {
        var headerHtml = '<div class="modal-header">'
            + '<h3><a href="http://tos-dr.info/#' + name + '" target="_blank"><img src="img/tosdr-logo-32.png" alt="" class="pull-left" />'
            + '</a></small>'
            + '<button id="closeButton" data-dismiss="modal" class="close pull-right" type="button">×</button></h3></div>';
        var classHtml = '<div class="tosdr-rating"><label class="label ' + verdict + '">'
            + (verdict ? 'Class ' + verdict : 'No Class Yet') + '</label><p>' + ratingText + '</p></div>';
        var pointsHtml = '';
        for (var i = 0; i < points.length; i++) {
            pointsHtml += '<li id="popup-point-' + name + '-' + points[i] + '" class="point"></li>';
        }
        var bodyHtml = '<div class="modal-body">' + classHtml + '<section class="specificissues"> <ul class="tosdr-points">' + pointsHtml + '</ul></section>';
        // Add Links
        if (isEmpty(links)) {
            bodyHtml += '<section><a href="http://tos-dr.info/get-involved.html" class="btn" target="_blank"><i class="icon  icon-list-alt"></i> Get Involved</a></section>';
        } else {
            bodyHtml += '<section><h4>Read the Terms</h4><ul class="tosback2">';
            for (var i in links) {
                bodyHtml += '<li><a target="_blank" href="' + links[i].url + '">' + (links[i].name ? links[i].name : i) + '</a></li>';
            }
            bodyHtml += '</ul></section>';
        }

        bodyHtml += '</div>';

        $('#page').html(headerHtml + bodyHtml);
        for (var i = 0; i < points.length; i++) {
            renderDataPoint(name, points[i]);
        }
    }
    
// get Service Data
self.on('message', function onMessage(addonMessage) {
    $.each(addonMessage,function(key , value){
        var serviceName = window.location.hash.substr(1);
        renderPopup(key,value);
        
        // send close message to hide the panel
        $('#closeButton,.close').click(function () {
            self.postMessage("close");
        });
});
});