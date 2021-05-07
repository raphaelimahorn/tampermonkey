// ==UserScript==
// @name         PR Change Count
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  displays how many lines are altered in the current PR
// @author       You
// @match        https://dev.azure.com/*/_git/*/pullrequest/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';
    //    var baseVersion = 'feature%2Fseafire%2Fnoissue_remove_id_fromOpenCustomerBacklogEvent';
    var urlGroups = document.URL.match(/(?<base>.*)_git\/(?<repo>.*)\/p/).groups;

    var branchname = document.getElementsByClassName('pr-header-branches')[0].getElementsByTagName('a')[0].textContent;
    console.log(branchname);
    var baseVersion = branchname.replaceAll('/', '%2F');

    var request = `${urlGroups.base}_apis/git/repositories/${urlGroups.repo}/diffs/commits?baseVersion=${baseVersion}&targetVersion=master&api-version=6.1-preview.1`;
    console.log(request);
    var changes;

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200 ) {
                changes = JSON.parse(this.responseText)?.changeCounts;
                if (!changes) return;

                var elementToInsert = document.getElementsByClassName('pr-secondary-title-row')[0];
                console.log(changes);
                if (changes.Edit){
                    changes.Add = (changes.Add ?? 0) + changes.Edit;
                    changes.Delete = (changes.Delete ?? 0) + changes.Edit;
                }
                console.log(changes);

                var span = document.createElement('span');
                elementToInsert.appendChild(span);
                elementToInsert = span;
                if(changes.Delete){
                    var delspan = document.createElement('span');
                    var deltext = document.createTextNode(`-${changes.Delete}`);
                    delspan.classList.add('repos-compare-removed-lines');
                    delspan.appendChild(deltext);
                    elementToInsert.appendChild(delspan);
                }
                if(changes.Add){
                    var addspan = document.createElement('span');
                    var addtext = document.createTextNode(`+${changes.Add}`);
                    addspan.classList.add('repos-compare-added-lines');
                    addspan.appendChild(addtext);
                    elementToInsert.appendChild(addspan);
                }
            }
        }
    };
    xhttp.open("GET", request , true);
    xhttp.send();
})();
