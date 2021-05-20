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
            success => showToast(`Successfully copied ${newClip.length} characters to clipboard`, 'success'),
            err => showToast('Could not copy to clipboard', 'warn'));
}