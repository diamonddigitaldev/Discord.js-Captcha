<h1 align="center">
    🎓 Discord.js Captcha 🎓
</h1>

<center style="margin-bottom:1rem;">A powerful package for Discord.js v14 that allows you to easily create CAPTCHAs for Discord servers.</center>

[![NPM](https://nodei.co/npm/discord.js-captcha.png)](https://npmjs.com/package/discord.js-captcha)

[![Downloads](https://img.shields.io/npm/dt/discord.js-captcha?logo=npm&style=flat-square)](https://npmjs.com/package/discord.js-captcha) [![Discord Server](https://img.shields.io/discord/667479986214666272?logo=discord&logoColor=white&style=flat-square)](https://diamonddigital.dev/discord)

<a href="https://www.buymeacoffee.com/willtda" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

Creating a CAPTCHA system on Discord can be quite challenging for some, but it doesn't have to be that way. Discord.js Captcha handles everything for you, from CAPTCHA generation and sending, to handling user responses and validity.

### <u>What is a **CAPTCHA**?</u>

Put simply, a **CAPTCHA** is a question you have to answer to prove you are not a robot.

**CAPTCHA** is an acronym for:

**C**ompletely

**A**utomated

**P**ublic

**T**uring Test (to tell)

**C**omputers (and humans)

**A**part

To learn more about what a CAPTCHA is, you can [watch this video](https://www.youtube.com/watch?v=o1zNIm8GVPY&ab_channel=TomScott) by Tom Scott.

# Install Package

To install this awesome module, type the command shown below into your Terminal.

`npm i discord.js-captcha --save`

For versions 3.0.0 and above, you'll also need Discord.js v14.

`npm i discord.js@14 --save`

For versions **earlier than 3.0.0**, you'll need Discord.js v13 instead. However it is recommended you update to gain access to more customisation options, as well as to patch bugs and security vulnerabilities!

`npm i discord.js@13 --save`

# Example Code

## Initial Setup:

```js
const { Client, IntentsBitField, EmbedBuilder } = require("discord.js");
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent, //IMPORTANT: make sure you enable "Message Content Intent" in the dev portal!
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.DirectMessages,
    ]
});

client.login("Discord Bot Token");

const { Captcha } = require("discord.js-captcha");

const captcha = new Captcha(client, {
    roleID: "Role ID Here", //optional. if provided, the role will be added on success
    channelID: "Text Channel ID Here", //optional
    sendToTextChannel: false, //optional, defaults to false
    kickOnFailure: true, //optional, defaults to true. whether you want the bot to kick the user if the captcha is failed
    caseSensitive: true, //optional, defaults to true. whether you want the captcha responses to be case-sensitive
    attempts: 3, //optional, defaults to 1. number of attempts before captcha is considered to be failed
    timeout: 30000, //optional, defaults to 60000. time the user has to solve the captcha on each attempt in milliseconds
    showAttemptCount: true, //optional, defaults to true. whether to show the number of attempts left in embed footer
    customPromptEmbed: new EmbedBuilder(), //customise the embed that will be sent to the user when the captcha is requested
    customSuccessEmbed: new EmbedBuilder(), //customise the embed that will be sent to the user when the captcha is solved
    customFailureEmbed: new EmbedBuilder(), //customise the embed that will be sent to the user when they fail to solve the captcha
});
```

### <u>**`channelID`** Option Explained</u>
The `channelID` option is the ID of the Discord Text Channel to Send the CAPTCHA to if the user's Direct Messages are locked.

Use the option `sendToTextChannel`, and set it to `true` to always send the CAPTCHA to the Text Channel.

### <u>**`sendToTextChannel`** Option Explained</u>
The `sendToTextChannel` option determines whether you want the CAPTCHA to be sent to a specified Text Channel instead of Direct Messages, regardless of whether the user's DMs are locked.

Use the option `channelID` to specify the Text Channel.

## Presenting a CAPTCHA to a Member (With Built-In CAPTCHA Creation):

Discord.js Captcha can automatically create a CAPTCHA for you, if you don't want to create one yourself.

**Note:** Built-In CAPTCHA Creation requires you to install the `canvas` package. (`npm i canvas --save`)

```js
client.on("guildMemberAdd", async member => {
    //in your bot application in the dev portal, make sure you have intents turned on!
    captcha.present(member); //captcha is created by the package, and sent to the member
});
```

## Presenting a CAPTCHA to a Member (With Custom CAPTCHA Image Data):

Don't like how the automatically created CAPTCHA looks? Simply pass in your own `CaptchaImageData` to the `present` method! You can also use Discord.js Captcha's Built-In CAPTCHA Creation to create your own CAPTCHA, and pass that in instead. (More on this [below](#manually-creating-a-captcha))

```js
client.on("guildMemberAdd", async member => {
    //in your bot application in the dev portal, make sure you have intents turned on!
    const captchaImageBuffer = //custom image as buffer
    const captchaImageText = //answer to the captcha as string
    captcha.present(member, { image: captchaImageBuffer, text: captchaImageText });
});
```

**Note:** When displaying a CAPTCHA to the user, the CAPTCHA image will automatically be attached to the `customPromptEmbed` for you.

In addition, if you have the `showAttemptCount` option enabled, any embed footer text on the `customPromptEmbed` will be overwritten with the number of attempts left.

## Manually Creating a CAPTCHA

You can use the `createCaptcha` method to easily create your own CAPTCHA using Discord.js Captcha's Built-In CAPTCHA Creation. It also comes with broader control over the length of the CAPTCHA, and the characters you would like to use by using a blacklist.

**Note:** Built-In CAPTCHA Creation uses `A-Z`, `a-z` and `0-9`.

```js
const { createCaptcha } = require("discord.js-captcha");

(async () => {
    //creating a CAPTCHA with 4 characters, and EXCLUDING numbers
    const myCaptcha = await createCaptcha(4, "0123456789");
    console.log(myCaptcha);
    // => { image: Buffer, text: "aBCd" }

    //createCaptcha resolves to an object that can be passed into the present method
    captcha.present(member, myCaptcha);
})();
```

# CAPTCHA Events

There are five events that you can use to log CAPTCHA actions, responses, and other details. They are:

- `prompt` - Emitted when a CAPTCHA is presented to a user.
- `answer` - Emitted when a user responds to a CAPTCHA.
- `success` - Emitted when a CAPTCHA is successfully solved.
- `failure` - Emitted when a CAPTCHA is failed to be solved.
- `timeout` - Emitted when a user does not solve the CAPTCHA in time.

All of these events are emitted by the `Captcha` class. Here's an example of how to use them:

```js
captcha.on("success", data => {
    console.log(`A Member has Solved a CAPTCHA!`);
    console.log(data);
});
```

# What do the CAPTCHAs look like?
Below is an image of what answering a CAPTCHA will look like when using the default settings:

![Image of Captcha](https://github.com/diamonddigitaldev/Discord.js-Captcha/blob/master/src/images/captchaExample.jpg?raw=true)

## Contact Me

- 👋 Need Help? [Join Our Discord Server](https://diamonddigital.dev/discord)!

- 👾 Found a Bug? [Open an Issue](https://github.com/diamonddigitaldev/Discord.js-Captcha/issues), or Fork and [Submit a Pull Request](https://github.com/diamonddigitaldev/Discord.js-Captcha/pulls) on our [GitHub Repository](https://github.com/diamonddigitaldev/Discord.js-Captcha)!
<hr>
<center>
<a href="https://diamonddigital.dev/"><strong>Created and maintained by</strong>
<img align="center" style="width:25%;height:auto" src="https://diamonddigital.dev/img/png/ddd_logo_text_transparent.png" alt="Diamond Digital Development Logo"></a>
</center>