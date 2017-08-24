jQuery(function () {
	
	var serviceName = window.location.hash.substr(1);
	function renderPopup(updatePopup) {
		console.log(service);
	  
		$("#service_url").attr('href', 'http://tosdr.org/#' + serviceName);
	  
		// links inside of the dataPoints should open in a new window
		$('.tosdr-points a').attr('target', '_blank');
		
		// [x] Button
		$('#closeButton,.close').click(function () {
			window.close();
		});
	}
	  
	jQuery.ajax('https://tosdr.org/api/1/service/' + serviceName + '.json').done(updatePopup);
});
