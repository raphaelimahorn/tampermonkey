// ==UserScript==
// @name         PR Change Count
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  displays how many lines are altered in the current PR
// @author       raphael.imahorn
// @match        https://dev.azure.com/*/_git/*/pullrequest/*?_a=files
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @updateURL    https://raw.githubusercontent.com/raphaelimahorn/tampermonkey/main/azure/pr_change_count.js
// ==/UserScript==

(async function () {
    'use strict';
    const affectedFiles = document.getElementsByClassName('repos-compare-toolbar')[0]
        ?.getElementsByClassName('body-m')[0]
        ?.textContent
        ?.match(/([0-9]+)/)[1];

    if (!+affectedFiles) {
        console.log("There are no files affected in this PR");
        return;
    }

    waitForChangesLoaded(+affectedFiles, processLoadedChanges);

    function waitForChangesLoaded(desiredChanges, callback, maxTries = 60) {
        // TODO this might not work as desired
        const loadedChanges = document.getElementsByClassName('repos-summary-code-diff').length + document.getElementsByClassName('repos-summary-message').length;
        if (loadedChanges < desiredChanges) {
            if (maxTries === 0) throw Error('There were not all files loaded in 60 tries');
            setTimeout(_ => waitForChangesLoaded(desiredChanges, callback, maxTries - 1), 500);
        } else {
            setTimeout(callback, 250);
            setTimeout(callback, 1000);
        }
    }

    function processLoadedChanges() {
        const files = [...document.getElementsByClassName('repos-summary-header')];

        let additions = 0;
        let deletions = 0;

        files.forEach(file => {
            deletions += +(file.getElementsByClassName('repos-compare-removed-lines')[0]?.textContent ?? 0);
            additions += +(file.getElementsByClassName('repos-compare-added-lines')[0]?.textContent ?? 0);
        });

        let elementToInsert = document.getElementsByClassName('pr-secondary-title-row')[0];
        document.getElementById('pr-change-count--repo-compare-lines')?.remove();
        const span = document.createElement('span');
        span.id = 'pr-change-count--repo-compare-lines';
        elementToInsert.appendChild(span);
        elementToInsert = span;

        if (deletions) {
            const delspan = document.createElement('span');
            const deltext = document.createTextNode(`${deletions}`);
            delspan.classList.add('repos-compare-removed-lines');
            delspan.appendChild(deltext);
            elementToInsert.appendChild(delspan);
        }

        if (additions) {
            const addspan = document.createElement('span');
            const addtext = document.createTextNode(`+${additions}`);
            addspan.classList.add('repos-compare-added-lines');
            addspan.appendChild(addtext);
            elementToInsert.appendChild(addspan);
        }
    }
})();