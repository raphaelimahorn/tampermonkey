// ==UserScript==
// @name         Highlight subtasks
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @updateURL    https://raw.githubusercontent.com/raphaelimahorn/tampermonkey/main/jira/highlight_subtasks.user.js
// @description  It colors the JIRA-Ids so that subtasks are easily recognized to which story they belong
// @author       raphael.imahorn
// @match        *.atlassian.net/jira/software/c/projects/*/boards/*
// @grant        none
// ==/UserScript==

(function () {
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
        group.querySelectorAll('a.ghx-key')
            .forEach(task => {
                if (task.classList.includes('dg-fancy')) return;
                // TODO, here one could split the inner html to 2 references
                task.innerHTML = `${issue} &#10148; ${task.dataset.tooltip}`;
                task.style.color = getRandomColor(issue);
                task.classList.add("dg-fancy");
            });
    };

    const debounce = (func, wait, immediate) => {
        let timeout;

        return function executedFunction() {
            const context = this;
            const args = arguments;

            const later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };

            const callNow = immediate && !timeout;

            clearTimeout(timeout);

            timeout = setTimeout(later, wait);

            if (callNow) func.apply(context, args);
        };
    };

    const makeLabelFancy = (label, issue) => label.style.color = getRandomColor(issue);

    const makeFancy = () => {
        const groups = [...document.querySelectorAll('.ghx-parent-group')];
        let storyLabels = new Set();
        [...groups].forEach(group => {
            let issue;

            // loop over groups where parent story is in an other column
            group.querySelectorAll('span.ghx-key')
                .forEach(label => {
                    issue = label.innerText;
                    storyLabels.add(issue);

                    makeLabelFancy(label, issue);
                });

            // loop over groups, where the story is in the same column
            if (!group.classList.includes("js-fake-parent")) {
                // take first element, aka the parent story
                const story = group.querySelector('a.ghx-key');
                issue = story.dataset.tooltip;
                storyLabels.add(issue);
            }

            colorChildren(group.querySelector('.ghx-subtask-group'), issue);
        });

        // color in the parent stories in an additional loop, because parents, that have no children in the same column,
        // wouldn't be colored otherwise
        document.querySelectorAll('.ghx-issue a.ghx-key')
            .forEach(story => {
                const issue = story.dataset.tooltip;
                if (!storyLabels.has(issue)) return;

                makeLabelFancy(story, issue);
            });
    };

    document.addEventListener("DOMNodeInserted", debounce(makeFancy, 100));
}());
