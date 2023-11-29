const neon = {}
neonTemplates(neon);

export function Component(selector, template, style, injectBridges = {}) {
    return function (Class) {

        class ComponentElement extends HTMLElement {
            constructor() {
                super();
                this.root = this.attachShadow({mode: 'open'});
                this.component = new Class();
                this.component.element = this.root;
                this.selector = selector;
                this._mount();
            }

            destroy() {
                this.#dismount();
            }

            _mount() {
                this._boundElementsCache = [];
                this._boundClickElementsCache = [];
                for (const bridgePropName in injectBridges) {
                    if (injectBridges[bridgePropName] in bridges) {
                        Object.defineProperty(this.component, bridgePropName, {
                            get: () => bridges[injectBridges[bridgePropName]],
                        });
                        bridges[injectBridges[bridgePropName]].subscribe(this.component);
                    } else {
                        console.error("Bridge not found", injectBridges[bridgePropName]);
                    }
                }

                const sheet = new CSSStyleSheet();
                sheet.replaceSync(styleCss + animationsCss + style);
                this.root.adoptedStyleSheets.push(sheet)

                let { fn, dependencies, boundDeps } = neon.render(this.parseTemplate(template), this.component);
                let reactiveData = createReactiveData(this.component, dependencies, () => {
                    diff(this.root, stringToHTML(fn(reactiveData)), {childrenOnly: true})
                    // TODO: (bind) and (click) events should be bound during diffing process to avoid the need of a
                    //  cache
                    this._bindInputs(boundDeps);
                    this._bindClickEvents();
                });

                diff(this.root, stringToHTML(fn(reactiveData)), {childrenOnly: true})
                this._bindInputs(boundDeps);
                this._bindClickEvents();

                if (typeof this.component.onMount === 'function') {
                    this.component.onMount();
                }
            }

            _bindProperty() {
                const elements = [...this.root.querySelectorAll(`[\\[disabled\\]]`)];
                const filteredElements = elements.filter((el) => !this._boundClickElementsCache.includes(el));
                for (let i = 0; i < filteredElements.length; i++) {
                    const expression = filteredElements[i].getAttribute('[disabled]');
                    let myFunc = new Function('return ' + expression).bind(this.component)
                    filteredElements[i].disabled = myFunc();
                    this._boundClickElementsCache.push(filteredElements[i]);
                }
            }

            _bindInputs(boundDeps) {
                for (let i = 0; i < boundDeps.length; i++) {
                    const depKey = boundDeps[i];
                    const elements = [...this.root.querySelectorAll(`[\\(bind\\)="${depKey}"]`)]
                    const filteredElements = elements.filter((el) => !this._boundElementsCache.includes(el));

                    for (let j = 0; j < filteredElements.length; j++) {
                        filteredElements[j].addEventListener('input', (e) => {
                            this.component[depKey] = e.target.value;
                        })
                        this._boundElementsCache.push(filteredElements[j]);
                    }
                }
            }

            _bindClickEvents() {
                const elements = [...this.root.querySelectorAll(`[\\(click\\)]`)];
                const filteredElements = elements.filter((el) => !this._boundClickElementsCache.includes(el));
                for (let i = 0; i < filteredElements.length; i++) {
                    const expression = filteredElements[i].getAttribute('(click)');
                    filteredElements[i].addEventListener('click', new Function('return ' + expression).bind(this.component))
                    this._boundClickElementsCache.push(filteredElements[i]);
                }
            }

            #dismount() {
                if (typeof this.component.onDismount === 'function') {
                    this.component.onDismount();
                }
            }

            #update() {
                if (typeof this.component.onUpdate === 'function') {
                    this.component.onUpdate();
                }
            }

            connectedCallback() {
                this.#update();
            }

            parseTemplate(template) {
                return template.replace(/\$component/g, 'this.getRootNode().host.component');
            }

            // Lifecycle methods
            // onMount() { }
            // onDismount() { }
            // onUpdate() { }
        }

        ComponentElement.selector = selector;

        if (!customElements.get(selector)) {
            customElements.define(selector, ComponentElement);
        }

        return ComponentElement;
    };
}

function createReactiveData(data, dependencies, render) {
    for (let key of dependencies) {
        if (data.hasOwnProperty(key)) {
            let internalValue = data[key];
            if (Array.isArray(internalValue)) {
                internalValue = new Proxy(internalValue, {
                    set: function(target, property, value) {
                        target[property] = value;
                        render();
                        return true;
                    }
                });
            }
            Object.defineProperty(data, key, {
                get() {
                    return internalValue;
                },
                set(newVal) {
                    internalValue = newVal;
                    render();
                }
            });
        }
    }
    return data;
}
