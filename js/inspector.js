// Listen to plugin creation
eagle.onPluginCreate(async (plugin) => {

    // Get the current theme
    const theme = await eagle.app.theme;
    document.body.setAttribute('theme', theme);

    // Get the selected item
    const selected = await eagle.item.getSelected();
    const item = selected[0];


    const positivePrompt = document.getElementById("positive_prompt");
    positivePrompt.innerText = await getParameters(item);
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
