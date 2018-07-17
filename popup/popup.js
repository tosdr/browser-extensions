/*global safari:false, $:false, Tosdr:false*/
"use strict";

(function () {

  function renderDataPoint(service, dataPointId) {
    $.ajax('https://tosdr.org/points/' + dataPointId + '.json', {
      success: function (dataPoint) {
        var badge, icon, sign, score;
        if (dataPoint.tosdr.point == 'good') {
          badge = 'badge-success';
          icon = 'thumbs-up';
          sign = '+';
        } else if (dataPoint.tosdr.point == 'mediocre') {
          badge = 'badge-warning';
          icon = 'thumbs-down';
          sign = '-';
        } else if (dataPoint.tosdr.point == 'alert') {
          badge = 'badge-important';
          icon = 'remove';
          sign = '×';
        } else if (dataPoint.tosdr.point == 'not bad') {
          badge = 'badge-neutral';
          icon = 'arrow-right';
          sign = '→';
        } else {
          badge = '';
          icon = 'question-sign';
          sign = '?';
        }
        document.getElementById('popup-point-' + service + '-' + dataPointId).innerHTML =
          '<div class="' + dataPoint.tosdr.point + '"><h5><span class="badge ' + badge +
          '" title="' + dataPoint.tosdr.point + '"><i class="icon-' + icon + ' icon-white">' +
          sign + '</i></span> <a target="_blank" href="' + dataPoint.discussion + '">' +
          dataPoint.name + '</a></h5><p>' + dataPoint.tosdr.tldr + '</p></div></li>';
        document.getElementById('popup-point-' + service + '-' + dataPointId).innerHTML =
          '<div class="' + dataPoint.tosdr.point + '"><h5><span class="badge ' + badge +
          '" title="' + dataPoint.tosdr.point + '"><i class="icon-' + icon + ' icon-white">' +
          sign + '</i></span> ' + dataPoint.name + ' <a href="' + dataPoint.discussion +
          '" target="_blank" class="label context">Discussion</a></h5><p>' + dataPoint.tosdr.tldr + '</p></div></li>';
      },
      dataType: 'json'
    });
  }

  var NOT_RATED_TEXT = "We haven't sufficiently reviewed the terms yet. Please contribute to our group: <a target=\"_blank\" href=\"https:\/\/tosdr.org\/get-involved.html\">Get&nbsp;involved!</a>.";
  var RATING_TEXT = {
    0: NOT_RATED_TEXT,
    "false": NOT_RATED_TEXT,
    "A": "The terms of service treat you fairly, respect your rights and follows the best practices.",
    "B": "The terms of services are fair towards the user but they could be improved.",
    "C": "The terms of service are okay but some issues need your consideration.",
    "D": "The terms of service are very uneven or there are some important issues that need your attention.",
    "E": "The terms of service raise very serious concerns."
  };

  function renderPopup(service) {
    renderPopupHtml(service.id, service.name, service.url, service.tosdr.rated, RATING_TEXT[service.tosdr.rated],
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

  function renderPopupHtml(name, longName, domain, verdict, ratingText, points, links, score) {
    var headerHtml = '<div class="modal-header"><h3><a href="https://tosdr.org/#' + name +
      '" target="_blank"><img src="images/tosdr-logo-32.png" alt="" class="pull-left" id="tosdr-logo" />' +
      '</a>' +
      ' for&nbsp; ' +
      '<img src="https://tosdr.org/logo/'+name+'.png" alt="" height="32">'+longName+'</h3></div>';
    var classHtml = '<div class="tosdr-rating"><label class="label ' + verdict + '">' +
      (verdict ? 'Class ' + verdict : 'No Class Yet') + '</label><p>' + ratingText + '</p></div>';
    var renderables=[];
    for(var i in points) {
      renderables.push(renderDataPoint(name, points[i], true));
    }
    renderables.sort(function(a, b) {
      return (Math.abs(b.score) - Math.abs(a.score));
    });
    var pointsHtml = '';
    for (var i = 0; i < points.length; i++) {
      pointsHtml += '<li id="popup-point-' + name + '-' + points[i] + '" class="point"></li>';
    }
//    for(var i=0; i<renderables.length; i++) {
//      pointsHtml += '<li id="popup-point-'+name+'-'+renderables[i].id+'" class="point">'
//        //+renderables[i].score+' '
//        +renderables[i].text
//        +'</li>\n';
//    }
    var bodyHtml = '<div class="modal-body">' + classHtml +
      '<section class="specificissues"> <ul class="tosdr-points">' + pointsHtml + '</ul></section>';

    // Add Links
    if (isEmpty(links)) {
      bodyHtml += '<section><a href="https://tosdr.org/get-involved.html" class="btn" target="_blank"><i class="icon  icon-list-alt"></i> Get Involved</a></section>';
    } else {
      bodyHtml += '<section><h4>Read the Terms</h4><ul class="tosback2">';
      for (var i in links) {
        bodyHtml += '<li><a target="_blank" href="' + links[i].url + '">' + (links[i].name ? links[i].name : i) + '</a></li>';
      }
      bodyHtml += '</ul></section>';
    }

    bodyHtml += '</div>';

    document.getElementById('page').innerHTML = headerHtml + bodyHtml;
    for (var i = 0; i < points.length; i++) {
      renderDataPoint(name, points[i]);
    }
  }

  function renderPopupEmptyHtml () {
    var headerHtml = '<div class="modal-header"><h3><a href="https://tosdr.org/' +
      '" target="_blank"><img src="images/tosdr-logo-32.png" alt="" class="pull-left" />' +
      '</a></h3></div>';
    var bodyHtml = '<div class="modal-body">' +
      '<p><strong>Not rated, yet.</strong><p>' +
      '<p>Write an email to <a href="mailto:tosdr@googlegroups.com">tosdr@googlegroups.com</a> with a link to the terms,' +
      ' a small quote from the terms about the point you‘re making and let us know if you think it‘s a good or a bad point.' +
      ' It‘s better to do one email thread by topic, rather than one email per service. For more details, <a href="https://tosdr.org/get-involved.html">read on</a>!</p>' +
      '</div>';
    document.getElementById('page').innerHTML = headerHtml + bodyHtml;
  }

  $(function () {
    function parseQueryString(queryString) {
      queryString = queryString.replace('?', '');
      var result = {};
      var params = queryString.split('&');
      params.forEach(function(param){
        param = param.split('=');
        result[param[0]] = param[1];
      });
      return result;
    }
    Tosdr.init(function () {
      var search = parseQueryString(location.search);
      var url = search.url && decodeURIComponent(search.url) || "";
      var service = Tosdr.getService(url);
      if (service) {
        renderPopup(service);
      }
      else {
        renderPopupEmptyHtml();
      }
    });
  });

})();
