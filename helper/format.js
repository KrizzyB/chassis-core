class Format {
    /**
     * Converts input into boolean
     * @param {*} input - Data to be converted.
     * @returns {Boolean} Boolean version of input.
     */

    static toBoolean(input) {
        let trueValues = [
            "Enabled",
            1,
            "1",
            "Yes",
            "yes"
        ];

        return trueValues.indexOf(input) >= 0;
    };

    /**
     * Converts boolean into 1 or 0
     * @param {Boolean} input - Boolean to be converted.
     * @returns {Number} Number version of input.
     */

    static fromBoolean(input) {
        if (input) {
            return 1;
        } else {
            return 0;
        }
    };

    /**
     * Converts data into an array using delimiter
     * @param {String} input - Data to be converted.
     * @param {String} delimiter - Delimiter used to determine the separation criteria..
     * @returns {Array} Array created from converted data.
     */

    static toArray(input, delimiter) {    //split multi-value fields into array
        let array;
        let keys;

        if (typeof input === "object") {
            keys = Object.keys(input);
            input = input[keys[0]];
        }

        array = buildArray(input);

        function buildArray(input) {
            let array = input.split(delimiter);
            if(array.length <= 1) {
                let array2 =  input.split("\u000A");
                if(array2.length > array.length) {
                    array = array2;
                }
            }

            let delimiterFound = false;

            for (let i=0; i<array.length; i++) {
                delimiterFound = false;
                if (array[i].trim() === "") {
                    array.splice(i, 1);
                    i=i-1;  //go back one index
                } else if (array[i].indexOf(delimiter) >= 0) {
                    delimiterFound = true;

                    let moreArray = array[i].split(delimiter);
                    array.concat(moreArray);
                } else {
                    array[i] = array[i].trim();

                    if (keys) {
                        let cell = array[i];
                        array[i] = {};
                        array[i][keys[0]] = cell;
                    }
                }
            }

            //check for input mistakenly split between two cells
            for (let i=0; i<array.length; i++) {
                if (keys) {
                    if (array[i][keys[0]][array[i][keys[0]].length-1] === ":") {
                        array[i][keys[0]] += " " + array[i+1][keys[0]];
                        array.splice(i+1, 1);   //cut off the next cell
                        i=i-1;  //go back one index
                    }
                }
            }

            return array;
        }
        return array;
    };

    /**
     * Identifies words and capitalises the first letter (Now correctly ignores articles).
     * @param {String} input - Boolean to be converted.
     * @param {Boolean} [nonEnglish] - If true, not all words will be capitalised, only the first word of each section.
     * @returns {String} Number version of input.
     */

    static fixCase(input, nonEnglish) {    //split multi-value fields into array
        let output = "";
        if (input) {
            let nonCapWords = ["a", "an", "at", "as", "by", "for", "of", "in", "is", "on", "up", "the", "to", "and", "but", "or", "nor", "with"];
            let sections = input.split("/");

            for (let s=0; s<sections.length; s++) { //for each section
                sections[s] = sections[s].trim(); //trim any spaces
                let words = sections[s].split(" ");
                sections[s] = "";

                for (let w=0; w<words.length; w++) {
                    words[w] = words[w].trim(); //trim any spaces

                    if (words[w] === "") {  //remove blank words
                        words.splice(w, 1);
                        w--
                    } else if (w === 0) {   //always fix first word
                        words[w] = fixWord(words[w]);   //fix word format
                        sections[s] += words[w] + " ";  //push clean word back into section
                    } else if (nonCapWords.indexOf(words[w].toLowerCase()) >=0) {    //word is in nonCapWords
                        sections[s] += words[w].toLowerCase() + " ";  //push lower case word back into section
                    } else if (words[w] === words[w].toUpperCase() || nonEnglish) {   //if word is already in full uppercase
                        sections[s] += words[w] + " ";
                    } else {
                        words[w] = fixWord(words[w]);   //fix word format
                        sections[s] += words[w] + " ";  //push clean word back into section
                    }
                }

                output += sections[s] + "/ ";
            }

            output = output.slice(0, output.lastIndexOf("/"));
            output = output.trim();
        } else {
            output = input;
        }

        return output;

        function fixWord(input) {
            let cap = input[0].toUpperCase();
            let low = input.slice(1).toLowerCase();
            return cap + low;
        }
    };

    /**
     * Converts a date into an easily manageable object.
     * @param {Date} [date] - Date to convert into object.
     * @returns {Object} - Object containing date attributes.
     */

    static date(date) {
        function leadingZeroCheck(input) {
            if (input < 10) {
                input = "0" + input;
            }
            return input;
        }

        //if no date is input, use today
        if (!date) {
            date = new Date();
        }

        let d = {
            year: date.getFullYear().toString(),
            month: (date.getMonth() + 1).toString(),
            date: date.getDate().toString(),
            hours: date.getHours().toString(),
            minutes: date.getMinutes().toString(),
            seconds: date.getSeconds().toString()
        };

        let keys = Object.keys(d);

        for (let i=0; i<keys.length; i++) {
            d[keys[i]] = leadingZeroCheck(d[keys[i]]);
        }

        return d;
    };
}

module.exports = Format;
