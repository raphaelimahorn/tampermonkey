/**
 * Add custom styling to the first style sheet of the current document
 * @param {string} customCss the new style: e.g. <code>div {display: flex;}</code>
 * */
function addCss(customCss) {
    const sheet = document.styleSheets[0];
    sheet.insertRule(customCss);
}