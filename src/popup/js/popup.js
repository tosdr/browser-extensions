/* global window, $, jQuery, getLiveServiceDetails, getRatingText */
/* eslint-disable indent */

function escapeHTML(unsafe) {
    return (`${unsafe}`)
        .replace(/&(?!amp;)/g, '&amp;')
        .replace(/<(?!lt;)/g, '&lt;')
        .replace(/>(?!gt;)/g, '&gt;')
        .replace(/"(?!quot;)/g, '&quot;')
        .replace(/'(?!#039;)/g, '&#039;');
}

jQuery(() => {
    function tosdrPoint(service, dataPoint) {
        let badge;
        let icon;
        // let sign;
        if (dataPoint) {
            if (dataPoint.tosdr.point === 'good') {
                badge = 'badge-success';
                icon = 'thumbs-up';
                // sign = '+';
            } else if (dataPoint.tosdr.point === 'bad') {
                badge = 'badge-warning';
                icon = 'thumbs-down';
                // sign = '-';
            } else if (dataPoint.tosdr.point === 'blocker') {
                badge = 'badge-important';
                icon = 'times';
                // sign = '×';
            } else if (dataPoint.tosdr.point === 'neutral') {
                badge = 'badge-secondary';
                icon = 'asterisk';
                // sign = '→';
            } else {
                badge = '';
                icon = 'question';
                // sign = '?';
            }
            const pointText = dataPoint.description || '';

            // Extract links from text
            const taggedText = pointText.split(/(<\/?\w+(?:(?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>)/gim);
            $(`#popup-point-${service.id}-${dataPoint.id}`)
                .append($('<div>', { class: dataPoint.point })
                    .append($('<h5>')
                        .append($('<span>', { class: `badge ${badge}`, title: escapeHTML(dataPoint.tosdr.point) })
                            .append($('<li>', { class: `fas fa-${icon}` })))
                        .append($('<a>', {
                            href: escapeHTML(dataPoint.discussion), target: '_blank', text: dataPoint.title,
                        }))));

            $(`#popup-point-${service.id}-${dataPoint.id}`).append($('<p>'));
            if (taggedText.length > 1) {
                taggedText.forEach((t) => {
                    $(`#popup-point-${service.id}-${dataPoint.id} p`).append(t);
                });
            } else {
                $(`#popup-point-${service.id}-${dataPoint.id} p`).text(pointText);
            }
        }
    }
    const serviceUrl = window.location.hash.substr(1);
    function updatePopup() {
        $('.loading').show();
        getLiveServiceDetails(serviceUrl).then((service) => {
            $('#service_url').attr('href', `https://tosdr.org/en/service/${service.id}`);
            $('#service_class').addClass(service.class);
            if (service.class !== false) {
                $('#service_class').text(`Grade ${service.class}`);
                $('#ratingText').text(getRatingText(service.class));
            } else {
                $('#service_class').text('No Grade Yet');
                $('#service_class').remove();
                $('#ratingText').text(getRatingText(service.class));
            }

            // Points
            service.points.forEach((p) => {
                $('.tosdr-points').append($('<li>', { id: `popup-point-${service.id}-${p}`, class: 'point' }));
                tosdrPoint(service, service.pointsData[p]);
            });

            // links inside of the dataPoints should open in a new window
            $('.tosdr-points a').attr('target', '_blank');

            $('#shieldimg').attr('src', `https://shields.tosdr.org/${service.id}.svg`);
            $('#shieldurl').val(`https://shields.tosdr.org/${service.id}.svg`);
            $('#serviceimg').attr('src', service.image).addClass('float-right');

            if (Object.keys(service.links).length > 0) {
                $('#linksList')
                    .append($('<h4>', { text: 'Read the Terms' }))
                    .append($('<ul>', { class: 'tosback2' }));

                Object.keys(service.links).forEach((d) => {
                    $('.tosback2').append($('<li>')
                        .append($('<a>', { href: escapeHTML(service.links[d].url), target: '_blank', text: service.links[d].name })));
                });
            }
            // [x] Button
            $('#closeButton,.close').click(() => {
                window.close();
            });

            $('.loading').hide();
        }).catch((err) => {
            console.error(err);
            $('#page').empty();
            $('#page').append($('<div>', { class: 'modal-body' })
                .append($('<div>', { class: 'tosdr-rating' })
                    .append($('<h4>', { text: 'This service is not rated, yet.' }))
                    .append($('<a>', { text: `Request ${serviceUrl} to be added`, class: 'btn btn-success btn-block', href: 'https://forum.tosdr.org/request' }))));
            $('.loading').hide();
        });
    }

    updatePopup();
});
