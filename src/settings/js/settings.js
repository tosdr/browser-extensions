/* global $, jQuery, browser, log */
/* eslint-disable indent */


function getFormData() {
    const formArray = $('form').serializeArray();
    log('raw_form', formArray);
    let returnArray = {}; /* eslint-disable-line prefer-const */
    for (let i = 0; i < formArray.length; i++) { /* eslint-disable-line no-plusplus */
        returnArray[formArray[i].name] = formArray[i].value;
    }
    $('form input:checkbox').each((index, input) => {
        log('input', $(input), index);
        returnArray[input.name] = input.checked;
    });

    returnArray.version = browser.runtime.getManifest().version;

    log('settings', returnArray);
    return returnArray;
}

function saveOptions(e) {
    if (e !== null) {
        e.preventDefault();
    }
    log('Saving settings...');
    $('.loading').show();


    if ($('input#advanced').is(':checked')) {
        $('#advancedmode').show();
    } else {
        $('#advancedmode').hide();
    }

    browser.storage.local.set({ settings: getFormData() }).then(() => $('.loading').hide());
}

jQuery(() => {
    function populateSettings(items) {
        $('form input').each((index, input) => {
            log('form_input', $(input), index);
            if ($(input).attr('type') === 'checkbox') {
                $(input).attr('checked', items.settings[input.name]);
            } else {
                $(input).val(items.settings[input.name]);
            }
            log(input.name, items.settings[input.name]);
        });
    }
    function updateSettings() {
        browser.storage.local.get('settings').then((items) => {
            if (typeof items.settings !== 'undefined') {
                log('Loading settings...', items.settings);
                populateSettings(items);
            }
            $('.loading').hide();
            saveOptions(null);
            populateSettings(items);
        });
    }
    $('form').on('change', saveOptions);
    updateSettings();
});
