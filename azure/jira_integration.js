// ==UserScript==
// @name         Azure DevOps Jira integration
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  link to jira
// @author       raphael.imahorn
// @match        https://dev.azure.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var repository = document.URL.match(/\/\/(?<base>.*?)\/(?<repo>.*)\/_git/).groups.repo;
    repository = repository.replaceAll("/", "_");

    var dgJiraBasepathRepository = `dgJiraBasepaths_${repository}`;
    localStorage[dgJiraBasepathRepository] || localStorage.setItem(dgJiraBasepathRepository, prompt(`Please enter the basepath of this repositories (${repository}) jira project:`, "https://jira.devinite.com/").replace(/\/$/, ""));

    var jiraBasePath = localStorage[dgJiraBasepathRepository];

    if (!jiraBasePath) return;

    const getAllIssues = _ => {
        var prTitle = document.querySelector("input[aria-label='Pull request title']").value;
        return prTitle.match(/[A-Za-z]+-[0-9]+/g)
            .map(s => s.toUpperCase());
    };

    var issues = getAllIssues();
    if (!issues) return;

    var elementToInsertLinks = document.getElementsByClassName('pr-secondary-title-row')[0].getElementsByTagName('div')[0];
    var span = elementToInsertLinks.insertBefore(document.createElement('span'), elementToInsertLinks.childNodes[2]);

    issues.forEach(issue => {
        var a = document.createElement('a');
        var linkText = document.createTextNode(issue);
        a.appendChild(linkText);
        a.title = issue;
        a.href = `${jiraBasePath}/browse/${issue}`;
        a.classList.add("bolt-link");
        span.appendChild(a);
    });
})();
