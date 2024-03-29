// ==UserScript==
// @name         Redirect Jira Issues
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Redirect Jira issues, that are in a google query to a desired jira url
// @author       raphael.imahorn
// @match        https://www.google.com/search?q=*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/raphaelimahorn/tampermonkey/main/jira/redirect-jira.user.js
// ==/UserScript==

(function() {
    'use strict';

    var url = document.URL;
    var story = url.match(/.*search\?q=(?<story>[A-Za-z]+-[0-9]+)&.*/)?.groups.story;
    if (!story) return;

    const IgnoreProject = 'DO NOT REDIRECT';
    var project = story.match(/(?<project>.*)-.*/).groups.project.toUpperCase();
    var localStorageIdentifier = `jira-project-${project.toLowerCase()}-redirect-url`;
    var redirectUrl = localStorage[localStorageIdentifier];
    if (redirectUrl) {
        if(redirectUrl === IgnoreProject) return;
        window.location.href = (redirectUrl + story);
        return;
    }

    redirectUrl = prompt(
        `Would you like to add redirects for queries wiht pattern ${project}-123 to a jira repitory? If so please insert the corresponding redirect base url:`,
        'https://jiradg.atlassian.net/browse/')
        ?.trim()
        ?? IgnoreProject;
    if (!redirectUrl.length) redirectUrl = IgnoreProject;

    localStorage.setItem(localStorageIdentifier, redirectUrl);

    if (redirectUrl && redirectUrl !== IgnoreProject) {
        window.location.href = (redirectUrl + story);
        return;
    }
})();
