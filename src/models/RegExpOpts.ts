/**
 * Represents the regular expression options.
 * @class
 * @constructor
 * @public
 */
export default class RegExpOpts {
    /**
     * A value indicating whether or not the string includes a variable keyword.
     * @type {boolean}
     * @public
     */
    public hasVarKeyword: boolean;

    /**
     * Initializes a new RegExpOpts instance.
     * @param {any} opts The regular expression options.
     */
    constructor(opts: any) {
        this.hasVarKeyword = opts.hasVarKeyword;
    }
}