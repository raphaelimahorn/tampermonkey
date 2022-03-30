// ==UserScript==
// @name         Tag Assistant
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  A script to create tags more easily
// @author       raphael.imahorn
// @match        https://dev.azure.com/*/tags
// @grant        none
// ==/UserScript==


(function () {
    'use strict';

    //#region common functions

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

    function findParentOfClass(node, clazz) {
        const parent = node.parentNode;

        if (!parent?.classList) return;

        return parent.classList.contains(clazz) ? parent : findParentOfClass(parent, clazz);
    }

    class Debouncer {
        constructor(func, wait, immediate = false) {
            this.func = func;
            this.wait = wait;
            this.immediate = immediate;
            this.timeout = null;
        }

        later(args) {
            this.timeout = null;
            if (!this.immediate) this.func(args);
        }

        call(...args) {
            const callNow = this.immediate && !this.timeout;

            clearTimeout(this.timeout);

            this.timeout = setTimeout(_ => this.later.apply(this, args), this.wait);

            if (callNow) this.func(args);
        }
    }

    //#endregion

    function createTextBox(abortSignal) {
        const box = document.createElement('span');
        box.style.position = 'absolute';

        document.body.appendChild(box);
        const probeLocationDebouncer = new Debouncer(target => {
            box.textContent = getFullPathFromNode(getNodeOrNone(target) ?? box.textContent)
        }, 100)
        const onMouseMove = (e) => {
            box.style.left = e.pageX + 15 + 'px';
            box.style.top = e.pageY + 15 + 'px';
            box.style.padding = '5px';
            box.style.backgroundColor = '#f3d35d';
            box.style.color = '#000';
            probeLocationDebouncer.call(e.path);
        }
        document.getElementsByClassName('bolt-table')[0].addEventListener('mousemove', onMouseMove, {signal: abortSignal});

        return box;
    }

    function removeTextBox(box) {
        box.remove();
    }

    function getNodeOrNone(target) {
        return target.find(t => t.classList?.contains('bolt-tree-row'))
    }

    function getVersion(node) {
        const match = node.textContent.match(/(?<version>\d+(\.\d+)+)(?<suffix>-[A-Z]+-\d+)?/);
        if (!match?.groups?.version) return '';

        return !!match.groups.suffix ? `${match.groups.version}${match.groups.suffix}` : match.groups.version;
    }

    function getPathOfNode(node) {
        return node.tagName === 'A' ? getVersion(node) : (node.getElementsByClassName('text-ellipsis')[0].textContent + '/');
    }

    function getFullPathFromNode(node) {
        let level = +node.ariaLevel;
        let path = getPathOfNode(node);
        let sibling = node;
        let siblingLevel = +sibling.ariaLevel;
        let counter = 0;
        while (level > 1) {
            while (siblingLevel >= level) {
                sibling = sibling.previousSibling;
                siblingLevel = +sibling.ariaLevel;
                if (++counter > 100) {
                    showToast('Es wurde kein pfad gefunden', 'error');
                    return undefined;
                }
            }
            level = siblingLevel;
            path = getPathOfNode(sibling) + path;
        }
        return path;
    }

    function setEnability(button, enabled) {
        button.disabled = !enabled;
        const classToAdd = enabled ? 'enabled' : 'disabled';
        const classToRemove = !enabled ? 'enabled' : 'disabled';
        button.classList.add(classToAdd);
        button.classList.remove(classToRemove);
    }

    function getDescriptionFromNode(node) {
        return node.getElementsByClassName('repos-tag-comment')[0].textContent;
    }

    function getDescriptionInput(node) {
        const dialog = findParentOfClass(node, 'bolt-dialog-content');
        return dialog?.getElementsByTagName('textarea')[0];
    }

    function setReactTextInputValue(input, value) {
        const nativeValueSetter = Object.getOwnPropertyDescriptor(input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, "value").set;
        nativeValueSetter.call(input, value);

        const event = new Event('input', {bubbles: true});
        input.dispatchEvent(event);
    }

    function addTagForEventHandler(event, addTagButton, newButton) {
        event.preventDefault();
        setEnability(newButton, false);
        const controller = new AbortController();
        const signal = controller.signal;
        const textBox = createTextBox(signal);

        function abortOnEscape(event) {
            if (event.key === "Escape") {
                event.preventDefault();
                endHandler();
            }
        }

        document.addEventListener('keyup', event => abortOnEscape(event), {signal});

        async function handleClick(event) {
            event.preventDefault();
            const nodeOrNone = getNodeOrNone(event.path);
            if (!nodeOrNone) return;

            const path = getFullPathFromNode(nodeOrNone);
            if (!path) return;

            let description;
            if (!path.endsWith('/')) {
                description = getDescriptionFromNode(nodeOrNone);
            }
            addTagButton.click();
            await new Promise(resolve => setTimeout(resolve, 100))
            const nameInput = document.getElementsByClassName('bolt-textfield-input item-name-input')[0];
            setReactTextInputValue(nameInput, path);

            if (!!description) {
                const descriptionInput = getDescriptionInput(nameInput);
                setReactTextInputValue(descriptionInput, description);
            }

            endHandler();
        }

        function endHandler() {
            controller.abort();
            removeTextBox(textBox);
            setEnability(newButton, true);
        }

        document.addEventListener('click', event => handleClick(event), {signal, capture: true})
    }

    function addButton() {
        const originalButton = document.getElementById('__bolt-add');
        const newButton = document.createElement('button');
        newButton.textContent = 'New tag for folder';
        newButton.classList.add('bolt-button', 'enabled', 'secondary');
        newButton.onclick = event => addTagForEventHandler(event, originalButton, newButton);
        originalButton.parentElement.appendChild(newButton);
    }

    (() => {
        addButton();
    })();
})();