eagle.onPluginCreate(async (plugin) => {

    // Get the current theme
    const theme = await eagle.app.theme;
    document.body.setAttribute('theme', theme);

    // Get the selected item
    const selected = await eagle.item.getSelected();
    const item = selected[0];

    const positivePrompt = document.getElementById("metadata");

    const { getParameters } = require(`${__dirname}/js/utils`);
    positivePrompt.innerText = await getParameters(item);
});

// Listen to theme changes
eagle.onThemeChanged((theme) => {
    document.body.setAttribute('theme', theme);
});
