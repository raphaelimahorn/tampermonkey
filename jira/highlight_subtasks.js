// ==UserScript==
// @name         Highlight subtasks
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  It colors the JIRA-Ids so that subtasks are easily recognized to which story they belong
// @author       raphael.imahorn
// @match        *.atlassian.net/secure/RapidBoard.jspa*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const getHash = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            let chr = name.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return Math.pow(hash % 1e+20, 4);
    }

    const getRandomColor = (name) => {
        const hash = getHash(name);
        const hue = hash % 360;
        const saturation = 70 + hash % (90 - 70);
        return `hsla(${hue}, ${saturation}%, 40%, 1)`;
    };

    const colorChildren = (group, issue) => {
        group.querySelectorAll('a.ghx-key-link')
            .forEach(task => {
            if(task.classList.contains('dg-fancy')) return;
            task.innerHTML = `${issue} &#10148; ${task.title}`;
            task.style.color = getRandomColor(issue);
            task.classList.add("dg-fancy");
        });
    };

    const debounce = (func, wait, immediate) => {
        var timeout;

        return function executedFunction() {
            var context = this;
            var args = arguments;

            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };

            var callNow = immediate && !timeout;

            clearTimeout(timeout);

            timeout = setTimeout(later, wait);

            if (callNow) func.apply(context, args);
        };
    };

    const makeLabelFancy = (label, issue) => {
                        label.style.background = getRandomColor(issue);
                label.style.color = '#fff';
                label.style.padding = "2px 4px";
                label.style.borderRadius = "4px";
    };

    const makeFancy = () => {
        const groups = [...document.querySelectorAll('.ghx-parent-group')];
        var storyLabels = new Set();
        [...groups].forEach(group => {
            var issue;
            group.querySelectorAll('span.ghx-key')
                .forEach(label => {
                issue = label.innerText;
                storyLabels.add(issue);

                makeLabelFancy(label, issue);
                label.style.marginLeft = "10px";
            });

            if(group.classList.contains("ghx-home")) {
                var story = group.querySelector('a.ghx-key-link');
                issue = story.title;
                storyLabels.add(issue);
            }

            colorChildren(group.querySelector('.ghx-subtask-group'), issue);
        });

        document.querySelectorAll('.ghx-issue a.ghx-key-link')
            .forEach(story => {
            var issue = story.title;
            if (!storyLabels.has(issue)) return;

            makeLabelFancy(story, issue);
        });
    };

    document.addEventListener("DOMNodeInserted", debounce(makeFancy, 100));
}());
