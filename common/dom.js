/**
 * recursively search for a parent of the specified class
 * @param {Node | ParentNode} node
 * @param {string} clazz the class
 */
function findParentOfClass(node, clazz) {
    const parent = node.parentNode;

    if (!parent?.classList) return;

    return parent.classList.includes(clazz)
        ? parent
        : findParentOfClass(parent, clazz);
}