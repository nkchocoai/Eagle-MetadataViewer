eagle.onPluginCreate(async (plugin) => {
    // Get the current theme
    const theme = await eagle.app.theme;
    document.body.setAttribute('theme', theme);

    const { getParameters, parse, parseTags } = require(`${__dirname}/js/utils`);
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
