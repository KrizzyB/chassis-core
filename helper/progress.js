class Progress {
    constructor(timeout) {
        let now = new Date().getTime();
        this.timeout = timeout;
        this.nextResponse = now + timeout;
    }

    getPercentage(position, length, message) {
        let _return = {};

        let now = new Date().getTime();
        if (now >= this.nextResponse || position === 0) {
            this.nextResponse = now + this.timeout;

            let percent = Math.round((position/length) * 100);
            if (message) {
                message = message.replace("%", percent + "%");
                _return = message
            } else {
                _return = percent;
            }
        } else {
            _return = false;
        }

        return _return;
    }
}

module.exports = Progress;
