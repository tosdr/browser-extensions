/* global $, jQuery, browser, log */
/* eslint-disable indent */


function getFormData(data = false) {
    const formArray = $('form').serializeArray();
    log('raw_form', formArray);
    let returnArray = {}; /* eslint-disable-line prefer-const */
    for (let i = 0; i < formArray.length; i++) { /* eslint-disable-line no-plusplus */
        returnArray[formArray[i].name] = (data ? $(formArray[i]).data('default') : formArray[i].value);
    }
    $('form input:checkbox').each((index, input) => {
        log('input', $(input), index);
        returnArray[input.name] = (data ? $(input).data('default') : input.checked);
    });

    returnArray.version = browser.runtime.getManifest().version;

    log('settings', returnArray);
    return returnArray;
}

function saveOptions(e, defaultData = false) {
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
    browser.storage.local.set({ settings: getFormData(defaultData) }).then(() => $('.loading').hide());
}

jQuery(() => {
    function populateSettings(items) {
        $('form input').each((index, input) => {
            log('form_input', $(input), index);
            if ($(input).attr('type') === 'checkbox') {
                let value = items.settings[input.name];
                if (typeof items.settings[input.name] === 'undefined' || items.settings[input.name] === '') {
                    value = $(input).data('default');
                    log(`${input.name} has no value, setting default.`);
                }
                $(input).attr('checked', value);
            } else {
                let value = items.settings[input.name];
                if (typeof items.settings[input.name] === 'undefined' || items.settings[input.name] === '') {
                    value = $(input).data('default');
                    log(`${input.name} has no value, setting default.`);
                }
                $(input).val(value);
            }
            log(input.name, items.settings[input.name]);
        });
    }
    function updateSettings() {
        browser.storage.local.get('settings').then((items) => {
            log('settings_exists', typeof items.settings !== 'undefined');
            if (typeof items.settings !== 'undefined') {
                log('Loading settings...', items.settings);
                populateSettings(items);
                $('.loading').hide();
                saveOptions(null);
            } else {
                $('.loading').hide();
                saveOptions(null, true);
                updateSettings();
            }
        });
    }
    $('form').on('change', saveOptions);
    updateSettings();
});
