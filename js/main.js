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
            console.log(parsedParameters);
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
