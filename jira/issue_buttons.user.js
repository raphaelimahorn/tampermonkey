// ==UserScript==
// @name         Jira Issue Buttons
// @namespace    http://tampermonkey.net/
// @version      3.0.2
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

    let mode = "board";

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

    function getIssueCardOnBoardOrNone(target) {

        return target.find(t => t?.dataset.componentSelector === 'platform-board-kit.ui.card-container');
    }

    function getIssueCardOrNone(target) {
        switch (mode) {
            case "board":
                return getIssueCardOnBoardOrNone(target);
            case "backlog":
                return target.find(t => t?.dataset.testid === 'software-context-menu.ui.context-menu.children-wrapper');
            case "single":
                return undefined;
        }
        throw Error(`Can not get card in unknown mode ${mode}`);
    }

    function getKeyFromId(card) {
        return card.id.replace("card-", "");
    }

    function getKeyFromCard(card) {
        switch (mode) {
            case "board":
                return getKeyFromId(card);
            case "backlog":
                const backlogKeyElement = card.querySelector('[data-test-id="software-backlog.card-list.card.card-contents.accessible-card-key"]');
                return backlogKeyElement.lastChild.innerText;
            case "single":
                return undefined;
        }

        throw Error(`Can not get key from card in unknown mode ${mode}`);
    }

    function getDescriptionFromRolePresentation(card) {
        const keyElement = card.querySelector('[role="presentation"]');
        return keyElement.innerText;
    }

    function getDescriptionFromCard(card) {
        switch (mode) {
            case "board":
                return getDescriptionFromRolePresentation(card);
            case "backlog":
                const backlogKeyElement = card.querySelector('[data-test-id="software-backlog.card-list.card.card-contents.accessible-card-key"]');
                return backlogKeyElement.querySelector('div').innerText;
            case "single":
                return undefined;
        }

        throw Error(`Can not get description from card in unknown mode ${mode}`);
    }

    function getUrlFromCard(card) {
        const keyElement = card.querySelector('a');
        return keyElement.href;
    }

    function getContextMenu() {
        return new Promise(resolve => setTimeout(resolve, 200))
            .then(_ => document.querySelector('[data-testid="software-context-menu.ui.context-menu-inner.context-menu-inner-container"]'));
    }

    function addItemToContextMenuList(list, text, func, liClasses, aClasses, spanClasses) {
        const element = document.createElement('li');
        element.classList = liClasses;
        const action = document.createElement('button');
        element.appendChild(action);
        action.title = text;
        action.href = '#';
        action.addEventListener('click', event => {
            event.preventDefault();
            func();
        });
        action.classList = aClasses;
        const span = document.createElement('span');
        span.innerText = text;
        span.classList = spanClasses;
        action.appendChild(span);
        list.appendChild(element);
    }

    function addItemsToContextMenu(contextMenu, key, description, url) {
        const list = contextMenu.querySelector('ul');
        const liClasses = list.lastChild.classList;
        const aClasses = list.lastChild.lastChild.classList;
        const spanClasses = list.lastChild.lastChild.lastChild.classList;
        list.appendChild(document.createElement('hr'));
        addItemToContextMenuList(list, 'Id als Link kopieren', _ => copyUrlToClipboard(url, key), liClasses, aClasses, spanClasses);
        addItemToContextMenuList(list, 'Id mit Beschreibung als Link kopieren', _ => copyUrlToClipboard(url, key + ' ' + description), liClasses, aClasses, spanClasses);
        teamName && addItemToContextMenuList(list, 'Branchnamen kopieren', _ => copyToClipboard(generateBranchName(key)), liClasses, aClasses, spanClasses);
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

        let card = getIssueCardOrNone(contextEvent.composedPath());

        const key = getKeyFromCard(card);
        const description = getDescriptionFromCard(card);
        const url = getUrlFromCard(card);

        const contextMenu = await getContextMenu();
        addItemsToContextMenu(contextMenu, key, description, url);
    }

    function activeSprint() {
        mode = "board";
        if (debug) console.log('Now in active Sprint');
    }

    function singleIssue() {
        mode = "single";
        if (debug) console.log('Detail page not implemented yet');
    }

    function backlog() {
        if (debug) console.log('Now in backlog');
        mode = "backlog";
    }
})();