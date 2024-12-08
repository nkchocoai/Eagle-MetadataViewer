eagle.onPluginCreate(async (plugin) => {
    // Get the current theme
    const theme = await eagle.app.theme;
    document.body.setAttribute('theme', theme);

    document.getElementById("send-to-memo").addEventListener("click", async function (e) {
        const selected = await eagle.item.getSelected();

        const checkboxPositive = document.getElementById("checkbox-positive");
        const checkboxNegative = document.getElementById("checkbox-negative");
        const checkboxParameters = document.getElementById("checkbox-parameters");
        for (let item of selected) {
            const parameters = await getParameters(item);
            const parsedParameters = parse(parameters);
            let outputParameters = [];
            if (checkboxPositive.checked) {
                outputParameters.push(parsedParameters["Positive"]);
            }
            if (checkboxNegative.checked) {
                outputParameters.push("Negative prompt:" + parsedParameters["Negative"]);
            }
            if (checkboxParameters.checked) {
                outputParameters.push(parsedParameters["Settings"]);
            }

            item.annotation = outputParameters.join("\n");
            await item.save();
        }
    });

    document.getElementById("send-to-tags").addEventListener("click", async function (e) {
        const selected = await eagle.item.getSelected();

        const textareaReplace = document.getElementById("textarea-replace");
        for (let item of selected) {
            const parameters = await getParameters(item);
            const parsedParameters = parse(parameters);

            let tags = parseTags(parsedParameters["Positive"]);
            let replacedTags = [];
            for (let tag of tags) {
                for (let line of textareaReplace.value.split(/\r\n|\n/)) {
                    const [pattern, replacement] = line.split(",");
                    tag = tag.replaceAll(pattern, replacement);
                }
                replacedTags.push(tag);
            }
            item.tags = replacedTags;
            await item.save();
        }
    });
});

// Listen to theme changes
eagle.onThemeChanged((theme) => {
    document.body.setAttribute('theme', theme);
});

async function getParameters(item) {
    if (item.ext == "png") {
        const sharp = require("sharp");

        const metadata = await sharp(item.filePath).metadata();
        const params = metadata.comments.find((comment) => comment.keyword == "parameters");
        return params.text;
    } else {
        const ExifReader = require("exifreader");
        const iconv = require("iconv-lite");

        const tags = await ExifReader.load(item.filePath);
        const exifString = iconv.decode(tags['UserComment'].value.slice(8), "utf-16");
        return exifString;
    }
}

// refer. https://github.com/receyuki/stable-diffusion-prompt-reader/blob/32b2eea715b5f7816222cef23af3deed7df04a30/sd_prompt_reader/format/a1111.py#L41
function parse(parameters) {
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

function parseTags(text) {
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
