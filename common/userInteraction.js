/**
 * displays a toast
 * @param {string} text the text to display
 * @param {string} type the type of toast currently supported: <code>info, warn, error, success</code> defaults to info
 * @param {number} duration ms to show the toast, defaults to 3 sec
 */
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

/** Copy a string to clip board
 * @param {string} newClip
 */
function copyToClipboard(newClip) {
    navigator.clipboard.writeText(newClip)
        .then(
            _ => showToast(`Successfully copied ${newClip.length} characters to clipboard`, 'success'),
            _ => showToast('Could not copy to clipboard', 'warn'));
}

/**
 * copy a url to clipboard
 * @param {string} url the url to copy
 * @param {string} text the text to be displayed
 */
function copyUrlToClipboard(url, text){

    navigator.clipboard.write([new ClipboardItem(
        {
            "text/plain": new Blob([text], {type: "text/plain"}),
            "text/html": new Blob([`<a href="${url}">${text}</a>`], {type: "text/html"})
        }
    )]).then(
        _ => showToast('Successfully copied link to clipboard', 'success'),
        _ => showToast('Could not copy to clipboard', 'warn'));
}