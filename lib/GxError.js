
class GxError extends Error{
    constructor(message, subject, fileName) {
        super(message);
        this.name = this.constructor.name;
        this.subject = subject;
        this.fileNAme = fileName;
        // This clips the constructor invocation from the stack trace.
        // It's not absolutely essential, but it does make the stack trace a little nicer.
        //  @see Node.js reference (bottom)
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = GxError;