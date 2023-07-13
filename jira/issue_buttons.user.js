// ==UserScript==
// @name         Jira Issue Buttons
// @namespace    http://tampermonkey.net/
// @version      2.2.2
// @updateURL    https://raw.githubusercontent.com/raphaelimahorn/tampermonkey/main/jira/issue_buttons.user.js
// @downloadURL  https://raw.githubusercontent.com/raphaelimahorn/tampermonkey/main/jira/issue_buttons.user.js
// @description  adds some functionality to jira issues
// @author       raphael.imahorn
// @match        *.atlassian.net/*
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';

    const debug = false;

    const teamName = loadOrInsertFromStorage('ri-jira-issues-team', 'Please insert your team name');

    let issueCardClass = 'ghx-issue';

    // common functions 
    function loadOrInsertFromStorage(id, description, defaultValue = '') {
        const persistedValue = localStorage.getItem(id);
        if (!!persistedValue) return persistedValue;

        const userInput = prompt(description, defaultValue);
        if (!!userInput) localStorage.setItem(id, userInput);

        return userInput;
    }

    function copyToClipboard(newClip) {
        navigator.clipboard.writeText(newClip)
            .then(_ => showToast(`Successfully copied ${newClip.length} characters to clipboard`, 'success'), _ => showToast('Could not copy to clipboard', 'warn'));
    }

    function showToast(text, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.appendChild(document.createTextNode(text));
        let color;
        switch (type) {
            case 'warn':
                color = '#FF9800';
                break;
            case 'error':
                color = '#D32F2F';
                break;
            case 'success':
                color = '#4CAF50';
                break;
            default:
                color = '#2196F3';
                break;
        }

        toast.style = `
          position: fixed;
          z-index: 1;
          left: 50%;
          bottom: 30px;
          background-color: ${color};
          padding: 16px;
          border-radius: 4px;
    `;
        document.getElementsByTagName('body')[0].appendChild(toast);
        setTimeout(_ => toast.remove(), duration);
    }

    function copyUrlToClipboard(url, text) {
        navigator.clipboard.write([new ClipboardItem({
            "text/plain": new Blob([text], {type: "text/plain"}),
            "text/html": new Blob([`<a href="${url}">${text}</a>`], {type: "text/html"})
        })]).then(_ => showToast('Successfully copied link to clipboard', 'success'), _ => showToast('Could not copy to clipboard', 'warn'));
    }

    // end common functions


    function generateBranchName(key) {
        const lowercaseKey = key.toLowerCase();
        const prefix = lowercaseKey.startsWith('sup') ? 'hotfix' : 'feature';
        return `${prefix}/${teamName}/${lowercaseKey}`.toLowerCase();
    }

    const main = () => {
        document.addEventListener('contextmenu', event => enrichContextMenu(event))
    };

    main();

    function getIssueCardOrNone(target) {
        return target.find(t => t.classList.contains(issueCardClass))
    }

    function getKeyFromCard(card) {
        const keyElement = card.querySelector('a.ghx-key');
        return keyElement.ariaLabel ?? keyElement.title;
    }

    function getDescriptionFromCard(card) {
        const keyElement = card.querySelector('.ghx-summary');
        return keyElement.textContent;
    }

    function getUrlFromCard(card) {
        const keyElement = card.querySelector('a.ghx-key');
        return keyElement.href;
    }

    function getContextMenu() {
        return new Promise(resolve => setTimeout(resolve, 200)).then(_ => document.getElementById('gh-ctx-menu-content'));
    }

    function addItemToContextMenuList(list, text, func) {
        const element = document.createElement('li');
        const action = document.createElement('a');
        element.classList.add('aui-list-item');
        element.appendChild(action);
        action.classList.add('aui-list-item-link');
        action.title = text;
        action.href = '#';
        action.addEventListener('click', event => {
            event.preventDefault();
            func();
        })
        action.innerText = text;
        list.appendChild(element);
    }

    function addItemsToContextMenu(contextMenu, key, description, url) {
        const title = document.createElement('h5');
        title.innerText = 'Infos Kopieren';
        const list = document.createElement('ul');
        list.classList.add('aui-list-section', 'aui-first');
        addItemToContextMenuList(list, 'Id als Link kopieren', _ => copyUrlToClipboard(url, key));
        addItemToContextMenuList(list, 'Id mit Beschreibung als Link kopieren', _ => copyUrlToClipboard(url, key + ' ' + description));
        teamName && addItemToContextMenuList(list, 'Branchnamen kopieren', _ => copyToClipboard(generateBranchName(key)));
        contextMenu.prepend(list);
        contextMenu.prepend(title);
    }

    async function enrichContextMenu(contextEvent) {
        // has to be checked before boards
        if (document.URL.includes('/backlog')) {
            backlog();
        } else if (document.URL.includes('/boards')) {
            activeSprint();
        } else if (document.URL.includes('/browse/')) {
            singleIssue();
        } else {
            if (debug) console.log('not in a supported area of the application')
            return;
        }

        const card = getIssueCardOrNone(contextEvent.composedPath());
        if (!card) {
            return;
        }

        const key = getKeyFromCard(card);
        const description = getDescriptionFromCard(card);
        const url = getUrlFromCard(card);

        const contextMenu = await getContextMenu();
        addItemsToContextMenu(contextMenu, key, description, url);
    }

    function activeSprint() {
        if (debug) console.log('Now in active Sprint');
        issueCardClass = 'ghx-issue';
    }

    function singleIssue() {
        if (debug) console.log('Detail page not implemented yet');
    }

    function backlog() {
        if (debug) console.log('Now in backlog');
        issueCardClass = 'ghx-issue-content';
    }
})();