function escapeHTML(unsafe) {
    return (''+unsafe)
        .replace(/&(?!amp;)/g, "&amp;")
        .replace(/<(?!lt;)/g, "&lt;")
        .replace(/>(?!gt;)/g, "&gt;")
        .replace(/"(?!quot;)/g, "&quot;")
        .replace(/'(?!#039;)/g, "&#039;");
  };
  
jQuery(function () {
  function tosdrPoint(serviceName ,dataPoint){
    var badge, icon, sign;
    if(dataPoint){
      if (dataPoint.point == 'good') {
        badge = 'badge-success';
        icon = 'thumbs-up';
        sign = '+';
      } else if (dataPoint.point == 'bad') {
        badge = 'badge-warning';
        icon = 'thumbs-down';
        sign = '-';
      } else if (dataPoint.point == 'blocker') {
        badge = 'badge-important';
        icon = 'remove';
        sign = '×';
      } else if (dataPoint.point == 'neutral') {
        badge = 'badge-neutral';
        icon = 'asterisk';
        sign = '→';
      } else {
        badge = '';
        icon = 'question-sign';
        sign = '?';
      }
      var pointText = dataPoint.description || '';

      //Extract links from text
      var taggedText = pointText.split(/(<\/?\w+(?:(?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>)/gim);
      $('#popup-point-' + serviceName + '-' + dataPoint.id)
        .append($("<div>", { class: dataPoint.point })
        .append($("<h5>")
          .append($("<span>", { class: 'badge ' + badge , title: escapeHTML(dataPoint.point)})
            .append($("<span>", { class: 'glyphicon glyphicon-' + icon}))
          )
          .append($("<span>").text(" " + dataPoint.title + " "))
          .append($("<a>", { href: escapeHTML(dataPoint.discussion) , target: '_blank', class : 'label context' , text: 'Discussion'}))
        ));

      $('#popup-point-' + serviceName + '-' + dataPoint.id).append($("<p>"));
      if(taggedText.length > 1){
        for (let t of taggedText) {
          $('#popup-point-' + serviceName + '-' + dataPoint.id + ' p').append(t);
        }
      }else{
        $('#popup-point-' + serviceName + '-' + dataPoint.id + ' p').text(pointText);
      }

    }
  };
  
  
  var NOT_RATED_TEXT = "We haven't sufficiently reviewed the terms yet. Please contribute to our group: tosdr@googlegroups.com.";
  var RATING_TEXT = {
    0: NOT_RATED_TEXT,
    "false": NOT_RATED_TEXT,
    "A": "The terms of service treat you fairly, respect your rights and follows the best practices.",
    "B": "The terms of services are fair towards the user but they could be improved.",
    "C": "The terms of service are okay but some issues need your consideration.",
    "D": "The terms of service are very uneven or there are some important issues that need your attention.",
    "E": "The terms of service raise very serious concerns."
  };
  
  var serviceUrl = window.location.hash.substr(1);
  function updatePopup() {
    $(".loading").show();
    
    getServiceDetails(serviceUrl).then((service)=>{      
      if(serviceUrl === "none"){
        $("#page").empty();
        $('#page').append($("<div>", {class : 'modal-body'})
        .append($("<div>", {class : 'tosdr-rating' })
        .append($("<h4>", { text : 'Not rated, yet.'}))
        .append($("<p>",{ text : 'Go to https://edit.tosdr.org to help us review it!' , class : 'lbldesc'}))));
      }else{
        $("#service_url").attr('href', 'http://tosdr.org/#' + escapeHTML(service.url));
    
        //Update class
        $("#service_class").addClass(service.rated);
        if(service.rated){
          $("#service_class").text("Class " + service.rated);
          $("#ratingText").text(RATING_TEXT[service.rated]);
        }else{
          $("#service_class").text("No Class Yet");
          $("#service_class").remove();
          $("#ratingText").text(RATING_TEXT[service.rated]);
          
        }
        
        
        //Points
        for (let i in service.points){
          $('.tosdr-points').append($("<li>", {id : 'popup-point-' + service.name + '-' + service.points[i].id , class:'point'}));
           tosdrPoint(service.name, service.points[i]);
        }
       
        
        // links inside of the dataPoints should open in a new window
        $('.tosdr-points a').attr('target', '_blank');
        
        if(service.documents.length > 0){
          $('#linksList')
          .append($("<h4>", { text : 'Read the Terms'}))
          .append($("<ul>", {class: 'tosback2'}));

          for (let i in service.documents) {
            $('.tosback2').append($("<li>")
            .append($("<a>", { href:escapeHTML(service.documents[i].url) , target: '_blank' , text :service.documents[i].name})));
          }
        }
        
      
      }
      // [x] Button
      $('#closeButton,.close').click(function () {
        window.close();
      });
      
      $(".loading").hide();
    });
  }
  
  updatePopup();
});
