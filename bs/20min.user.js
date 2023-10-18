// ==UserScript==
// @name         Filter 20 Min
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Filters away bad content from 20 min
// @author       raphael.imahorn
// @match        https://www.20min.ch/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    document.addEventListener("DOMContentLoaded", () => {
        const sheet = document.styleSheets[0];
        const style = 
`p, span, h1, h2, h3, h4, dt, dd, dl, img, button, figure {
    filter: blur(.25em);
}`;

        sheet.insertRule(style);
    });
})();
