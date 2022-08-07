/* global window, $, jQuery, getLiveServiceDetails, getRatingText,
getTweetText, browser, FALLBACK_SHIELDS, log, compareVersion */
/* eslint-disable indent */

function escapeHTML(unsafe) {
    return (`${unsafe}`)
        .replace(/&(?!amp;)/g, '&amp;')
        .replace(/<(?!lt;)/g, '&lt;')
        .replace(/>(?!gt;)/g, '&gt;')
        .replace(/"(?!quot;)/g, '&quot;')
        .replace(/'(?!#039;)/g, '&#039;');
}

function loading(_element, _loading) {
    if (_loading) {
        $(_element).show();
        $('#sharelist').hide();
        $('#seperator').hide();
        $('#updatecheck').hide();
        $('#updatecheckbottom').hide();
        $('#tosdrlinks').hide();
    } else {
        $(_element).hide();
        $('#sharelist').show();
        $('#seperator').show();
        $('#updatecheck').show();
        $('#updatecheckbottom').show();
        $('#tosdrlinks').show();
    }
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
                            href: escapeHTML(dataPoint.discussion), target: '_blank', class: 'ml-2', text: dataPoint.title,
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
        $('#closeButton,.close').click(() => {
            window.close();
        });
        loading('.loading', true);
        getLiveServiceDetails(serviceUrl).then((service) => {
            log('service', service);
            browser.storage.local.get('settings').then((items) => {
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

                if (!items.settings.hideshields) {
                    $('#shieldimg').attr('src', `${(typeof items.settings === 'undefined' ? FALLBACK_SHIELDS : items.settings.shield_endpoint)}/${service.id}.svg`);
                    $('#shieldurl').val(`${(typeof items.settings === 'undefined' ? FALLBACK_SHIELDS : items.settings.shield_endpoint)}${service.id}.svg`);
                    $('#privacyshield').show();
                }
                if (!items.settings.hidetwitter) {
                    $('#twitter_url').show();
                }
                if (items.settings.curator) {
                    $('#edit_url').attr('href', `https://edit.tosdr.org/services/${service.id}/edit`);
                    $('#add_document_url').attr('href', `https://edit.tosdr.org/documents/new?service=${service.id}`);
                    $('[data-visiblity="curator"]').show();
                }
                $('#serviceimg').attr('src', service.image).addClass('float-right');
                if (getTweetText(service) !== false) {
                    $('#twitter_url').attr('href', encodeURI(`https://twitter.com/intent/tweet?text=${getTweetText(service)}&via=ToSDR&hashtags=ToS`));
                } else {
                    $('#twitter_url').remove();
                }

                if (Object.keys(service.links).length > 0) {
                    $('#linksList')
                        .append($('<h4>', { text: 'Read the Terms' }))
                        .append($('<ul>', { class: 'tosback2' }));

                    Object.keys(service.links).forEach((d) => {
                        $('.tosback2').append($('<li>')
                            .append($('<a>', { href: escapeHTML(service.links[d].url), target: '_blank', text: service.links[d].name })));
                    });
                }

                loading('.loading', false);
                if (!items.settings.dontcheckforupdates) {
                    compareVersion().then((response) => {
                        if (response.parameters.compare === -1) {
                            $('#updatecheck').html(`You are running an unreleased version (${response.parameters.given}), bugs may occur.`);
                            $('#updatecheck').addClass('alert alert-warning');
                        } else if (response.parameters.compare === 0) {
                            $('#updatecheck').remove();
                            $('#updatecheckbottom').html('You are up to date, cool beans!');
                            $('#updatecheckbottom').addClass('alert alert-success');
                        } else {
                            $('#updatecheck').html(`Your version (${response.parameters.given}) is out of date! The Latest version is ${response.parameters.latest}`);
                            $('#updatecheck').addClass('alert alert-danger');
                        }
                    });
                } else {
                    $('#updatecheckbottom').remove();
                    $('#updatecheck').remove();
                }
            });
        }).catch(() => {
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
