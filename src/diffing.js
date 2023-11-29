const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;

// Helper function to convert a template string into HTML DOM nodes
export const stringToHTML = (str) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.body;
};

export default function diff(originTree, newTree, options) {
    if (options && options.childrenOnly) {
        updateChildren(newTree, originTree);
        return originTree;
    }

    return walk(newTree, originTree);
}

function walk(newNode, originNode) {
    if (!originNode) return newNode;
    else if (!newNode) return null;
    else if (newNode.isSameNode && newNode.isSameNode(originNode)) return originNode;
    else if (newNode.tagName !== originNode.tagName) return newNode;
    else {
        patchNodes(newNode, originNode);
        updateChildren(newNode, originNode);
        return originNode;
    }
}

function updateChildren(newNode, originNode) {
    let originChild = null;
    let newChild = null;
    let patchedNode = null;
    let originMatch = null;

    let offset = 0;

    for (let i = 0; ; i++) {
        originChild = originNode.childNodes[i];
        newChild = newNode.childNodes[i - offset];

        // Both nodes are empty, so we do nothing
        if (!originChild && !newChild) break;

        // There is no new child, so remove the origin child
        else if (!newChild) {
            originNode.removeChild(originChild);
            i--;
        }

        // There is no origin child, so add the new child
        else if (!originChild) {
            originNode.appendChild(newChild);
            offset++;
        }

        // Both nodes are identical, so patch them
        else if (checkNodeSameness(newChild, originChild)) {
            patchedNode = walk(newChild, originChild);
            if (patchedNode !== originChild) {
                originNode.replaceChild(patchedNode, originChild);
                offset++;
            }

            // Both child nodes don't share an id or placeholder, so try to reorder them.
        } else {
            originMatch = null;

            // Try and find a similar node somewhere else in the origin tree
            for (let j = i; j < originNode.childNodes.length; j++) {
                if (checkNodeSameness(newChild, originNode.childNodes[j])) {
                    originMatch = originNode.childNodes[j];
                    break;
                }
            }

            // If there was a node with the same ID or placeholder in the origin list
            if (originMatch) {
                patchedNode = walk(newChild, originMatch);
                if (patchedNode !== originMatch) offset++;
                originNode.insertBefore(patchedNode, originChild);

                // If neither node has an ID, we can patch the two nodes in-place
            } else if (!newChild.id && !originChild.id) {
                patchedNode = walk(newChild, originChild);
                if (patchedNode !== originChild) {
                    originNode.replaceChild(patchedNode, originChild);
                    offset++;
                }

                // Insert the new node at the index if we couldn't patch it or find a matching node
            } else {
                originNode.insertBefore(newChild, originChild);
                offset++;
            }
        }
    }
}

function checkNodeSameness(newNode, originNode) {
    if (newNode.id) return newNode.id === originNode.id;
    if (newNode.isSameNode) return newNode.isSameNode(originNode);
    if (newNode.tagName !== originNode.tagName) return false;
    if (newNode.type === TEXT_NODE) return newNode.nodeValue === originNode.nodeValue;
    return false;
}

function patchNodes(newNode, originNode) {
    let nodeType = newNode.nodeType;
    let nodeName = newNode.nodeName;

    if (nodeType === ELEMENT_NODE) {
        if (nodeName.includes('-')) {
            return;
        }
        copyAttributes(newNode, originNode);
    }

    if (nodeType === TEXT_NODE || nodeType === COMMENT_NODE) {
        if (originNode.nodeValue !== newNode.nodeValue)
            originNode.nodeValue = newNode.nodeValue;
    }

    if (nodeName === 'INPUT') updateInput(newNode, originNode)
    else if (nodeName === 'OPTION') updateOption(newNode, originNode)
    else if (nodeName === 'TEXTAREA') updateTextArea(newNode, originNode)
}

function copyAttributes(newNode, originNode) {
    let originAttributes = originNode.attributes;
    let newAttributes = newNode.attributes;
    let attributeNamespaceURI = null;
    let attributeValue = null;
    let fromValue = null;
    let attributeName = null;
    let attribute = null;

    // Patch in attributes found on the new node?
    for (let i = newAttributes.length - 1; i >= 0; i--) {
        attribute = newAttributes[i];
        attributeName = attribute.name;
        attributeNamespaceURI = attribute.namespaceURI;
        attributeValue = attribute.value;
        if (attributeNamespaceURI) {
            attributeName = attribute.localName || attributeName;
            fromValue = originNode.getAttributeNS(attributeNamespaceURI, attributeName);
            if (fromValue !== attributeValue) {
                originNode.setAttributeNS(attributeNamespaceURI, attributeName, attributeValue);
            }
        } else {
            if (!originNode.hasAttribute(attributeName))
                originNode.setAttribute(attributeName, attributeValue);
            else {
                fromValue = originNode.getAttribute(attributeName);
                if (fromValue !== attributeValue) {
                    if (attributeValue === 'null' || attributeValue === 'undefined')
                        originNode.removeAttribute(attributeName)
                    else
                        originNode.setAttribute(attributeName, attributeValue)
                }
            }
        }

        for (let j = originAttributes.length - 1; j >= 0; j--) {
            attribute = originAttributes[j];
            if (attribute.specified !== false) {
                attributeName = attribute.name;
                attributeNamespaceURI = attribute.namespaceURI;

                if (attributeNamespaceURI) {
                    attributeName = attribute.localName || attributeName;
                    if (!newNode.hasAttributeNS(attributeNamespaceURI, attributeName)) {
                        originNode.removeAttributeNS(attributeNamespaceURI, attributeName);
                    }
                } else {
                    if (!newNode.hasAttributeNS(null, attributeName)) {
                        originNode.removeAttribute(attributeName);
                    }
                }
            }
        }
    }
}

function updateOption(newNode, originNode) {
    updateAttribute(newNode, originNode, 'selected');
}

function updateInput(newNode, originNode) {
    let newValue = newNode.value;
    let oldValue = originNode.value;

    updateAttribute(newNode, originNode, 'checked');
    updateAttribute(newNode, originNode, 'disabled');

    if (newValue.indeterminate !== oldValue.indeterminate)
        originNode.indeterminate = newValue.indeterminate;

    // File inputs can't be changed programmatically
    if (originNode.type === 'file') return;

    if (newValue !== oldValue) {
        originNode.setAttribute('value', newValue);
        originNode.value = newValue;
    }

    if (newValue === "null") {
        originNode.value = "";
        originNode.removeAttribute('value');
    }

    if (!newNode.hasAttributeNS(null, 'value')) {
        originNode.removeAttribute('range');
    } else if (originNode.type === 'number') {
        // Elements like slider for example, should move their slider button
        originNode.value = newValue
    }
}

function updateTextArea(newNode, originNode) {
    let newValue = newNode.getAttribute('value');
    if (newValue !== originNode.value)
        originNode.value = newValue;

    if (originNode.firstChild && originNode.firstChild.nodeValue !== newValue) {
        // Needed for IE. Apparently IE sets the placeholder as the
        // node value and vise versa. This ignores an empty update.
        if (newValue === '' && originNode.firstChild.nodeValue === originNode.placeholder) {
            return
        }

        originNode.firstChild.nodeValue = newValue
    }
}

function updateAttribute (newNode, originNode, name) {
    if (newNode[name] !== originNode[name]) {
        originNode[name] = newNode[name];
        if (newNode[name])
            originNode.setAttribute(name, '');
        else
            originNode.removeAttribute(name);
    }
}

const events = [
    '(click)',
    '(bind)'
];
