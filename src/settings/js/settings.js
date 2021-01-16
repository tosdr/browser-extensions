/* global $, jQuery, browser */
/* eslint-disable indent */

function getFormData() {
    const unindexedArray = $('form').serializeArray();
    const indexedArray = [];

    $.map(unindexedArray, ((n) => { unindexedArray[n.name] = n.value; }));

    $('form input:checkbox').each(() => { indexedArray[this.name] = this.checked; });

    return indexedArray;
}

function saveOptions(e) {
    if (e !== null) {
        e.preventDefault();
    }
    $('.loading').show();
    browser.storage.local.set({ settings: getFormData() }).then(() => $('.loading').hide());
}

jQuery(() => {
    function updateSettings() {
        browser.storage.local.get('settings').then((items) => {
            $('form input').each(() => {
                if ($(this).attr('type') === 'checkbox') {
                    $(this).attr('checked', items.settings[this.name]);
                } else {
                    $(this).val(items.settings[this.name]);
                }
            });
            $('.loading').hide();
            saveOptions(null);
        });
    }
    $('form').on('change', saveOptions);
    updateSettings();
});
