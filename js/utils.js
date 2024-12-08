"use strict";

module.exports = class {
    static func = (s) => {
        return s + s;
    };

    static getParameters = async (item) => {
        if (item.ext == "png") {
            const sharp = require("sharp");

            const metadata = await sharp(item.filePath).metadata();
            const params = metadata.comments.find((comment) => comment.keyword == "parameters");
            return params.text;
        } else {
            const ExifReader = require("exifreader");
            const iconv = require("iconv-lite");

            const tags = await ExifReader.load(item.filePath);
            let exifString = iconv.decode(tags['UserComment'].value.slice(8), "utf-16");
            return exifString;
        }
    }

    // refer. https://github.com/receyuki/stable-diffusion-prompt-reader/blob/32b2eea715b5f7816222cef23af3deed7df04a30/sd_prompt_reader/format/a1111.py#L41
    static parse = (parameters) => {
        let paramPositive = "";
        let paramNegative = "";
        let paramSettings = "";
        let stepsIndex = parameters.indexOf("\nSteps:");
        if (stepsIndex != -1) {
            paramPositive = parameters.slice(0, stepsIndex).trim();
            paramSettings = parameters.slice(stepsIndex).trim();
        }

        if (parameters.includes("Negative prompt:")) {
            let promptIndex = parameters.indexOf("\nNegative prompt:");
            if (stepsIndex != -1) {
                paramNegative = parameters.slice(promptIndex + "Negative prompt:".length + 1, stepsIndex).trim();
            } else {
                paramNegative = parameters.slice(promptIndex + "Negative prompt:".length + 1).trim();
            }
            paramPositive = parameters.slice(0, promptIndex).trim();
        } else if (stepsIndex == -1) {
            paramPositive = parameters;
        }

        const pattern = /\s*([^:,]+):\s*([^,]+)/g;
        const settings = [...paramSettings.matchAll(pattern)];

        let settingDict = {
            "Positive": paramPositive,
            "Negative": paramNegative,
            "Settings": paramSettings,
        };
        for (let setting of settings) {
            settingDict[setting[1]] = setting[2];
        }

        return settingDict;
    }


    static parseTags = (text) => {
        text = text.replaceAll("\\(", "{[{[");
        text = text.replaceAll("\\)", "}]}]");

        let weights = tokenWeights(text, 1.0);
        let tags = [];

        weights.forEach(([t]) => {
            t.split(",").forEach(tag => {
                tag = tag.trim();
                if (tag) {
                    tag = tag.replaceAll("{[{[", "\\(");
                    tag = tag.replaceAll("}]}]", "\\)");
                    tags.push(tag);
                }
            });
        });

        return tags;
    }

};

// refer. https://github.com/comfyanonymous/ComfyUI/blob/8e4118c0de2c23098db4601fc25a4bd55868d82b/comfy/sd1_clip.py#L243-L289
function parseParentheses(string) {
    let result = [];
    let currentItem = "";
    let nestingLevel = 0;

    for (let char of string) {
        if (char === "(") {
            if (nestingLevel === 0) {
                if (currentItem) {
                    result.push(currentItem);
                    currentItem = "(";
                } else {
                    currentItem = "(";
                }
            } else {
                currentItem += char;
            }
            nestingLevel++;
        } else if (char === ")") {
            nestingLevel--;
            if (nestingLevel === 0) {
                result.push(currentItem + ")");
                currentItem = "";
            } else {
                currentItem += char;
            }
        } else {
            currentItem += char;
        }
    }

    if (currentItem) {
        result.push(currentItem);
    }

    return result;
}

function tokenWeights(string, currentWeight) {
    let parts = parseParentheses(string);
    let output = [];

    for (let part of parts) {
        let weight = currentWeight;

        // Check if part is wrapped in parentheses
        if (part.length >= 2 && part.startsWith("(") && part.endsWith(")")) {
            part = part.slice(1, -1);
            let colonIndex = part.lastIndexOf(":");

            // Adjust weight
            weight *= 1.1;

            if (colonIndex > 0) {
                try {
                    weight = parseFloat(part.slice(colonIndex + 1));
                    part = part.slice(0, colonIndex);
                } catch (e) {
                    // Ignore errors and use the adjusted weight
                }
            }

            // Recursively process nested content
            output = output.concat(tokenWeights(part, weight));
        } else {
            output.push([part, currentWeight]);
        }
    }

    return output;
}
