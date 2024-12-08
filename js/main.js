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

        let succeededItem = [];
        let failedItem = [];

        for (let item of selected) {
            try {
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
                let result = await item.save();
                if (result) {
                    succeededItem.push(item);
                } else {
                    failedItem.push(item);
                }
            } catch (error) {
                console.error(error);
                failedItem.push(item);
            }
        }
        alertSaveResult(succeededItem, failedItem);
    });

    document.getElementById("send-to-tags").addEventListener("click", async function (e) {
        const selected = await eagle.item.getSelected();

        const textareaReplace = document.getElementById("textarea-replace");
        const checkboxToLower = document.getElementById("checkbox-to-lower");

        let succeededItems = [];
        let failedItems = [];

        for (let item of selected) {
            try {
                const parameters = await getParameters(item);
                const parsedParameters = parse(parameters);

                let tags = parseTags(parsedParameters["Positive"]);
                let replacedTags = [];
                for (let tag of tags) {
                    for (let line of textareaReplace.value.split(/\r\n|\n/)) {
                        const [pattern, replacement] = line.split(",");
                        tag = tag.replaceAll(pattern, replacement);
                    }
                    if (checkboxToLower.checked) {
                        tag = tag.toLowerCase();
                    }
                    replacedTags.push(tag);
                }
                item.tags = replacedTags;
                let result = await item.save();
                if (result) {
                    succeededItems.push(item);
                } else {
                    failedItems.push(item);
                }
            } catch (error) {
                console.error(error);
                failedItems.push(item);
            }
        }
        alertSaveResult(succeededItems, failedItems);
    });
});

function alertSaveResult(succeededItems, failedItems) {
    let s = `${succeededItems.length} items saved tags.`;
    if (failedItems.length > 0) {
        s += "\n\n[Failed]";
        for (let item of failedItems) {
            s += `\n- ${item.name}.${item.ext}`
        }
    }
    alert(s);
}

// Listen to theme changes
eagle.onThemeChanged((theme) => {
    document.body.setAttribute('theme', theme);
});
