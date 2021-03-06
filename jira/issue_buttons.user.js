﻿// ==UserScript==
// @name         Jira Issue Buttons
// @namespace    http://tampermonkey.net/
// @version      1.1.1
// @updateURL    https://raw.githubusercontent.com/raphaelimahorn/tampermonkey/main/jira/issue_buttons.user.js
// @description  adds some buttons to jira issues
// @author       raphael.imahorn
// @match        *.atlassian.net/secure/RapidBoard.jspa*
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';

    const debug = false;

    const buttonContainerClass = 'ri-jira-footer-buttons';
    const buttonClass = 'ri-jira-story-button';
    const teamName = loadOrInsertFromStorage('ri-jira-issues-team', 'Please insert your team name');

    const getFooters = () => document.getElementsByClassName('ghx-card-footer');

    const filterAlreadyModifiedFooters = footers => [...footers].filter(f => !f.classList.contains(buttonContainerClass));

    const setButtonTextContent = (button, content) => {
        button.classList.add('aui-button', 'aui-button-compact', 'aui-button-subtle', buttonClass);
        button.appendChild(document.createTextNode(content));
    };

    // common functions 
    function loadOrInsertFromStorage(id, description, defaultValue = '') {
        const persistedValue = localStorage.getItem(id);
        if (!!persistedValue) return persistedValue;

        const userInput = prompt(description, defaultValue);
        if (!!userInput) localStorage.setItem(id, userInput);

        return userInput;
    }

    function findParentOfClass(node, clazz) {
        const parent = node.parentNode;

        if (!parent?.classList) return;

        return parent.classList.contains(clazz)
            ? parent
            : findParentOfClass(parent, clazz);
    }

    function copyToClipboard(newClip) {
        navigator.clipboard.writeText(newClip)
            .then(
                success => showToast(`Successfully copied ${newClip.length} characters to clipboard`, 'success'),
                err => showToast('Could not copy to clipboard', 'warn'));
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

    // end common functions


    const findKeyNode = node => {
        const issueNode = findParentOfClass(node, 'ghx-issue');
        return issueNode?.getElementsByClassName('ghx-key')[0];
    }

    /** @param {Node} button
     * @param {MouseEvent} event
     */
    const copyIssueAsMarkUp = (button, event) => {
        const keyNode = findKeyNode(button);
        if (!keyNode) return;

        const issue = keyNode.textContent;
        const issueUrl = keyNode.firstElementChild.href;

        const link = `[${issue}](${issueUrl})`;
        copyToClipboard(link);
        event.stopPropagation();
    };

    /** @param {Node} button
     * @param {MouseEvent} event
     */
    const copyBranchName = (button, event) => {
        const keyNode = findKeyNode(button);
        if (!keyNode) return;

        const issue = keyNode.textContent.toLowerCase();

        const prefix = issue.startsWith('sup') ? 'hotfix' : 'feature';

        const link = `${prefix}/${teamName}/${issue}`;
        copyToClipboard(link);
        event.stopPropagation();
    };

    /**
     * @param {Node} node
     */
    const getKeyAndTitleOfStory = node => {
        const keyNode = findKeyNode(node);
        if (!keyNode) return;

        const key = keyNode.textContent;
        const description = keyNode.nextSibling.textContent;
        return `${key} ${description}`;
    }

    /**
     * @param parent
     * @param {Node} node
     */
    const getKeyAndTitleOfSubTask = (parent, node) => {
        let subtask = getKeyAndTitleOfStory(node);
        if (!subtask) return;


        const parentKey = parent.getElementsByClassName('ghx-key')[0];
        if (!parentKey) return subtask;

        const key = parentKey.textContent;
        const description = parentKey.nextSibling.textContent;
        const story = `${key} ${description}`;

        // used for interoperability with highlight_subtask userscript
        const parts = subtask.split(' ➤ ');
        subtask = parts[parts.length - 1];

        if (subtask === story) return story;

        return `${subtask} <- ${story}`;
    }

    /** @param {Node} button
     * @param {MouseEvent} event
     */
    const copyKeyAndTitle = (button, event) => {
        const parentNodeIfAny = findParentOfClass(button, 'ghx-parent-group');

        const keyAndTitle = !parentNodeIfAny
            ? getKeyAndTitleOfStory(button)
            : getKeyAndTitleOfSubTask(parentNodeIfAny, button);

        if (!keyAndTitle) return;

        copyToClipboard(keyAndTitle);
        event.stopPropagation();
    };

    const addCopyMarkupLink = parent => {
        const btn = document.createElement('button');

        setButtonTextContent(btn, '[]()'); // TODO

        btn.onclick = event => copyIssueAsMarkUp(btn, event);

        parent.appendChild(btn);
    };

    const addCopyBranchName = parent => {
        if (!teamName) return;

        const btn = document.createElement('button');

        setButtonTextContent(btn, '~/~/~'); // TODO

        btn.onclick = event => copyBranchName(btn, event);

        parent.appendChild(btn);
    };

    const addCopyKeyAndTitle = parent => {
        const btn = document.createElement('button');

        setButtonTextContent(btn, 'desc'); // TODO

        btn.onclick = event => copyKeyAndTitle(btn, event);

        parent.appendChild(btn);
    }

    const addButtonListToFooters = footers => [...footers].forEach(footer => {
        const container = document.createElement('div');
        container.classList.add(buttonContainerClass);

        // add buttons
        addCopyKeyAndTitle(container);
        addCopyBranchName(container);
        addCopyMarkupLink(container);

        footer.appendChild(container);
    });

    function addCss(customCss) {
        const sheet = document.styleSheets[0];
        sheet.insertRule(customCss);
    }

    const main = () => {
        if (debug) console.log('Started adding buttons to issues');

        const footers = getFooters();

        const filteredFooters = filterAlreadyModifiedFooters(getFooters());

        if (debug) console.log(`found ${filteredFooters.length} elements to add buttons`);

        addButtonListToFooters(filteredFooters);

        if (!footers.length) setTimeout(main, 200);
    };

    addCss(`
    .${buttonContainerClass} {
        display: inline-flex;
        flex-grow: 99;
        justify-content: flex-end;
    }`);

    addCss(`
    .${buttonClass} {
        padding: 0 !important;
    }
    `);

    main();
})();