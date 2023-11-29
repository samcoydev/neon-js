export const bridges = new Map();

export function Bridge(selector) {
    return function(Class) {
        return class extends Class {
            constructor(...args) {
                super(...args);
                this.selector = selector;
                bridges[selector] = this;
                this.observers = [];
            }

            subscribe(observer) {
                this.observers.push(observer);
            }

            unsubscribe(observer) {
                this.observers = this.observers.filter(obs => obs !== observer);
            }

            notify() {
                this.observers.forEach(observer => observer.update(this));
            }
        }
    }
}
