class Debouncer {
    /**
     * @param {function(*): void} func the function that should be debounced
     * @param {number} wait the timeout between two executions
     * @param {boolean} immediate indicates if the function should be executed before or after the interval has been awaited
     */
    constructor(func, wait, immediate = false) {
        this.func = func;
        this.wait = wait;
        this.immediate = immediate;
        this.timeout = null;
    }

    /**
     * @param {*[]} args arguments to pass to the function
     */
    later(args) {
        this.timeout = null;
        if (!this.immediate) this.func(args);
    }

    /**
     * @param {*} args arguments to pass to the function
     */
    call(...args) {
        const callNow = this.immediate && !this.timeout;

        clearTimeout(this.timeout);

        this.timeout = setTimeout(_ => this.later.apply(this, args), this.wait);

        if (callNow) this.func(args);
    }
}