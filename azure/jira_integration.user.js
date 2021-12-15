// ==UserScript==
// @name         Azure DevOps Jira integration
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @updateURL    https://raw.githubusercontent.com/raphaelimahorn/tampermonkey/main/azure/jira_integration.user.js
// @description  link to jira
// @author       raphael.imahorn
// @match        https://dev.azure.com/*
// @match        https://*.visualstudio.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let repository = document.URL.match(/\/\/(?<base>.*?)\/(?<repo>.*)\/_git/).groups.repo;
    repository = repository.replaceAll("/", "_");

    const dgJiraBasepathRepository = `dgJiraBasepaths_${repository}`;
    localStorage[dgJiraBasepathRepository] || localStorage.setItem(dgJiraBasepathRepository, prompt(`Please enter the basepath of this repository's (${repository}) jira project:`, "https://jiradg.atlassian.net/").replace(/\/$/, ""));

    const jiraBasePath = localStorage[dgJiraBasepathRepository];

    if (!jiraBasePath) return;

    const getAllIssues = _ => {
        const prTitle = document.querySelector("input[aria-label='Pull request title']").value;
        return prTitle.match(/[A-Za-z]+-[0-9]+/g)
            .map(s => s.toUpperCase());
    };

    const issues = getAllIssues();
    if (!issues) return;

    const elementToInsertLinks = document.getElementsByClassName('pr-secondary-title-row')[0].getElementsByTagName('div')[0];
    const span = elementToInsertLinks.insertBefore(document.createElement('span'), elementToInsertLinks.childNodes[2]);

    issues.forEach(issue => {
        const a = document.createElement('a');
        const linkText = document.createTextNode(issue + ' ');
        a.appendChild(linkText);
        a.title = issue;
        a.href = `${jiraBasePath}/browse/${issue}`;
        a.classList.add("bolt-link");
        span.appendChild(a);
    });
})();
