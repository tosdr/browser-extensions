jQuery(function () {
	
	var NOT_RATED_TEXT = "We haven't sufficiently reviewed the terms yet. Please contribute to our group: <a target=\"_blank\" href=\"https:\/\/groups.google.com/d/forum/tosdr\">tosdr@googlegroups.com</a>.";
	  var RATING_TEXT = {
	    0: NOT_RATED_TEXT,
	    "false": NOT_RATED_TEXT,
	    "A": "The terms of service treat you fairly, respect your rights and follows the best practices.",
	    "B": "The terms of services are fair towards the user but they could be improved.",
	    "C": "The terms of service are okay but some issues need your consideration.",
	    "D": "The terms of service are very uneven or there are some important issues that need your attention.",
	    "E": "The terms of service raise very serious concerns."
	};
	
	var serviceName = window.location.hash.substr(1);
	function updatePopup(service) {
		console.log(JSON.stringify(service));
	  
		$("#service_url").attr('href', 'http://tosdr.org/#' + serviceName);
	  
	  //Update class
		$("#service_class").addClass(service.class);
		if(service.class){
			$("#service_class").text("Class " + service.class);
		}else{
			$("#service_class").text("No Class Yet");
		}
		$("#ratingText").text(RATING_TEXT[service.class]);
		
		// links inside of the dataPoints should open in a new window
		$('.tosdr-points a').attr('target', '_blank');
		
		// [x] Button
		$('#closeButton,.close').click(function () {
			window.close();
		});
	}
	  
	jQuery.ajax('https://tosdr.org/api/1/service/' + serviceName + '.json').done(updatePopup);
});
