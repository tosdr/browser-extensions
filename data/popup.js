function escapeHTML(str) str.replace(/[&"<>]/g, function (m) ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[m]);

self.port.on("tosdrpoint", function (dataPoint){
	var badge, icon, sign;
	if(dataPoint[1]){
		if (dataPoint[1].tosdr.point == 'good') {
			badge = 'badge-success';
			icon = 'thumbs-up';
			sign = '+';
		} else if (dataPoint[1].tosdr.point == 'bad') {
			badge = 'badge-warning';
			icon = 'thumbs-down';
			sign = '-';
		} else if (dataPoint[1].tosdr.point == 'blocker') {
			badge = 'badge-important';
			icon = 'remove';
			sign = '×';
		} else if (dataPoint[1].tosdr.point == 'neutral') {
			badge = 'badge-neutral';
			icon = 'asterisk';
			sign = '→';
		} else {
			badge = '';
			icon = 'question-sign';
			sign = '?';
		}
		var pointText = dataPoint[1].tosdr.tldr;
		
		//Extract links from text
		var taggedText = pointText.split(/(<\/?\w+(?:(?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>)/gim);

		$('#popup-point-' + dataPoint[0] + '-' + dataPoint[1].id)
			.append($("<div>", { class: dataPoint[1].tosdr.point })
			.append($("<h5>")
				.append($("<span>", { class: 'badge ' + badge , title: escapeHTML(dataPoint[1].tosdr.point) })
					.append($("<span>", { class: 'glyphicon glyphicon-' + icon}))
				)
				.append($("<span>").text(" " + dataPoint[1].title + " "))
				.append($("<a>", { href: escapeHTML(dataPoint[1].discussion) , target: '_blank', class : 'label context' , text: 'Discussion'}))
			));
		
		$('#popup-point-' + dataPoint[0] + '-' + dataPoint[1].id).append($("<p>"));
		if(taggedText.length > 1){
			for(i =0; i< taggedText.length; i++){
				var hrefRegex = /href=("|')(.*?)("|')/g;
				var tagsRegex = /<(em|strong)>/g;
				var hrefResults = hrefRegex.exec(taggedText[i]);
				var tagsResults = tagsRegex.exec(taggedText[i]);
				
				if(hrefResults){
					var url = (hrefResults[2].match(/^index\.html/)) ? "http://tosdr.org/" + hrefResults[2] : hrefResults[2];
					$('#popup-point-' + dataPoint[0] + '-' + dataPoint[1].id + ' p').append($("<a>", {href : escapeHTML(url), text: escapeHTML(taggedText[i+1]), class : "pointshref" , target : "_blank"}));
					i+= 2;
				}else if(tagsResults){
					var tag = tagsResults[1];
					$('#popup-point-' + dataPoint[0] + '-' + dataPoint[1].id + ' p').append($("<" + escapeHTML(tag) + ">", {text : escapeHTML(taggedText[i+1]) }));
					i+= 2;
				}else{
					$('#popup-point-' + dataPoint[0] + '-' + dataPoint[1].id + ' p').append(escapeHTML(taggedText[i]));
				}
			}
		}else{
			$('#popup-point-' + dataPoint[0] + '-' + dataPoint[1].id + ' p').text(escapeHTML(pointText));	
		}			
		
	}
});
 
        
function renderDataPoint(service, dataPointId) {
	var renderdata = [];
	renderdata[0] = service;
	renderdata[1] = dataPointId;
	self.port.emit("renderDataPoint", renderdata);           
}

var NOT_RATED_TEXT = "We haven't sufficiently reviewed the terms yet. Please contribute to our group: ";
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
	renderPopupHtml(name, service.name, service.url, service.tosdr.rated, RATING_TEXT[service.tosdr.rated], service.points.reverse(), service.links);
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
	$('#page').empty();
	
	//Modal-header
	$('#page').append(
		$("<div>", { class: 'modal-header' })
		.append($("<button>", { id: 'closeButton' , class : 'close' , type: 'button', text: 'x'}))
		.append($("<h4>", {class : 'modal-title'})
			.append($("<a>", { href: 'http://tosdr.org/#' + escapeHTML(name) , target: '_blank' })
				.append($("<img>", { src: 'img/tosdr-logo-32.png'}))
			)
		)
	);
	
	//Modal-body
	$('#page').append($("<div>", {class : 'modal-body'})
		.append($("<div>", {class : 'tosdr-rating' })
		.append($("<label>", { class : 'label ' + verdict , text : (verdict ? 'Class ' + verdict : 'No Class Yet')}))
		.append($("<p>",{ text : ratingText , class : 'lbldesc'})))
	);
	
	if(!verdict)
		$('.lbldesc').append($('<a>', {href : 'mailto:tosdr@googlegroups.com' , text : 'tosdr@googlegroups.com' , target :'_blank'}));
		
	
	$(".modal-body")
		.append($("<section>", {class : 'specificissues'})
			.append($("<ul>", {class : 'tosdr-points'}))
	);
	
	// append points
	for (var i = 0; i < points.length; i++) {
		$('.tosdr-points').append($("<li>", {id : 'popup-point-' + name + '-' + points[i] , class:'point'}));
	}
			
	if (isEmpty(links)) {
		$('.modal-body').append($("<section>")
			.append($("<a>", { href:'http://tosdr.org/get-involved.html' , target: '_blank' , class: 'btn'})
			.append($("<i>", {class: 'icon  icon-list-alt'}))
			.append("Get Involved"))
		);
	} else {
		$('.modal-body').append($("<section>")
		.append($("<h4>", { text : 'Read the Terms'}))
		.append($("<ul>", {class: 'tosback2'})));
			
		for (var i in links) {
			$('.tosback2').append($("<li>")
			.append($("<a>", { href:links[i].url , target: '_blank' , text :(links[i].name ? links[i].name : i)})));
		}
	}
	
	for (var i = 0; i < points.length; i++) {
		renderDataPoint(name, points[i]);
	}
	
}

    
// get Service Data
self.on('message', function onMessage(addonMessage) {
	console.log("tosdr: Panel popup received matched service data.")
	$.each(addonMessage,function(key , value){
		console.log("tosdr: Rendering service data in popup");
		renderPopup(key,value);   
		// send close message to hide the panel
		$('#closeButton,.close').click(function () {
			self.postMessage("close");
		});
	});
});
