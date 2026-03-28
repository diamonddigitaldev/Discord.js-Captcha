const { Client, GuildMember, EmbedBuilder, ChannelType, version } = require("discord.js");
const EventEmitter = require("events");
const createCaptcha = require("./createCaptcha");
const handleChannelType = require("./handleChannelType");
const { logError, logWarning } = require("./log");

/**
 * @typedef {Object} CaptchaImageData
 * @prop {Buffer} image The CAPTCHA Image.
 * @prop {String} text The Answer to the CAPTCHA.
 */

/**
 * Captcha Options
 * @typedef {Object} CaptchaOptions
 * @prop {String} [roleID=undefined] (OPTIONAL): The ID of the Discord Role to Give when the CAPTCHA is complete. If provided, the role will be added on success.
 * @prop {String} [channelID=undefined] (OPTIONAL): The ID of the Discord Text Channel to Send the CAPTCHA to if the user's Direct Messages are locked. Use the option "sendToTextChannel", and set it to "true" to always send the CAPTCHA to the Text Channel.
 * @prop {Boolean} [sendToTextChannel=false] (OPTIONAL): Whether you want the CAPTCHA to be sent to a specified Text Channel instead of Direct Messages, regardless of whether the user's DMs are locked. Use the option "channelID" to specify the Text Channel.
 * @prop {Boolean} [kickOnFailure=true] (OPTIONAL): Whether you want the Bot to Kick the User if the CAPTCHA is Failed.
 * @prop {Boolean} [caseSensitive=true] (OPTIONAL): Whether you want the CAPTCHA to be case-sensitive.
 * @prop {Number} [attempts=1] (OPTIONAL): The Number of Attempts Given to Solve the CAPTCHA.
 * @prop {Number} [timeout=60000] (OPTIONAL): The Time in Milliseconds before the CAPTCHA expires and the User fails the CAPTCHA.
 * @prop {Boolean} [showAttemptCount=true] (OPTIONAL): Whether you want to show the Attempt Count in the CAPTCHA Prompt. (Displayed in Embed Footer)
 * @prop {EmbedBuilder} [customPromptEmbed=undefined] (OPTIONAL): Custom Discord Embed to be Shown for the CAPTCHA Prompt.
 * @prop {EmbedBuilder} [customSuccessEmbed=undefined] (OPTIONAL): Custom Discord Embed to be Shown for the CAPTCHA Success Message.
 * @prop {EmbedBuilder} [customFailureEmbed=undefined] (OPTIONAL): Custom Discord Embed to be Shown for the CAPTCHA Failure Message.
 * 
 */

class Captcha extends EventEmitter {

    /**
    * Creates a New Instance of the Captcha Class.
    * 
    * __Captcha Options__
    * 
    * - `roleID` - The ID of the Discord Role to Give when the CAPTCHA is complete. If provided, the role will be added on success.
    *
    * - `channelID` - The ID of the Discord Text Channel to Send the CAPTCHA to if the user's Direct Messages are locked.
    *
    * - `sendToTextChannel` - Whether you want the CAPTCHA to be sent to a specified Text Channel instead of Direct Messages, regardless of whether the user's DMs are locked.
    *
    * - `kickOnFailure` - Whether you want the Bot to Kick the User if the CAPTCHA is Failed.
    * 
    * - `caseSensitive` - Whether you want the the CAPTCHA to be case-sensitive.
    * 
    * - `attempts` - The Number of Attempts Given to Solve the CAPTCHA.
    * 
    * - `timeout` - The Time in Milliseconds before the CAPTCHA expires and the User fails the CAPTCHA.
    * 
    * - `showAttemptCount` - Whether you want to show the Attempt Count in the CAPTCHA Prompt. (Displayed in Embed Footer)
    * 
    * - `customPromptEmbed` - Custom Discord Embed to be Shown for the CAPTCHA Prompt.
    * 
    * - `customSuccessEmbed` - Custom Discord Embed to be Shown for the CAPTCHA Success Message.
    * 
    * - `customFailureEmbed` - Custom Discord Embed to be Shown for the CAPTCHA Failure Message.
    * 
    * @param {CaptchaOptions} options The Options for the Captcha.
    * @param {Client} client The Discord Client.
    * @param {CaptchaOptions} options
    * @example
    * const { Client, IntentsBitField, EmbedBuilder } = require("discord.js");
    * const client = new Client({
    *    intents: [
    *        IntentsBitField.Flags.Guilds,
    *        IntentsBitField.Flags.GuildMessages,
    *        IntentsBitField.Flags.MessageContent, //IMPORTANT: make sure you enable "Message Content Intent" in the dev portal!
    *        IntentsBitField.Flags.GuildMembers,
    *        IntentsBitField.Flags.DirectMessages,
    *    ]
    * });
    *
    * const { Captcha } = require("discord.js-captcha");
    *
    * const captcha = new Captcha(client, {
    *     roleID: "Role ID Here",
    *     channelID: "Text Channel ID Here",
    *     sendToTextChannel: false, //defaults to false
    *     kickOnFailure: true, //defaults to true. whether you want the bot to kick the user if the captcha is failed
    *     caseSensitive: true, //defaults to true. whether you want the captcha responses to be case-sensitive
    *     attempts: 3, //defaults to 1. number of attempts before captcha is considered to be failed
    *     timeout: 30000, //defaults to 60000. time the user has to solve the captcha on each attempt in milliseconds
    *     showAttemptCount: true, //defaults to true. whether to show the number of attempts left in embed footer
    *     customPromptEmbed: new EmbedBuilder(), //customise the embed that will be sent to the user when the captcha is requested
    *     customSuccessEmbed: new EmbedBuilder(), //customise the embed that will be sent to the user when the captcha is solved
    *     customFailureEmbed: new EmbedBuilder(), //customise the embed that will be sent to the user when they fail to solve the captcha
    * });
    */
    constructor(client, options = {}) {
        super();

        //check discord.js version
        if (version.split(".")[0] < 14) logError(`Discord.js v14 or later is required.\nPlease check the README for finding a compatible version for Discord.js v${version.split(".")[0]}`);

        if (!client) logError("No Discord Client was Provided!");
        this.client = client;
        /**
        * Captcha Options
        * @type {CaptchaOptions}
        */
        this.options = options;

        if ((options.sendToTextChannel === true) && (!options.channelID)) logError('Option "sendToTextChannel" was set to true, but "channelID" was not Provided!');
        if (options.attempts < 1) logError('Option "attempts" must be Greater than 0!');
        if (options.timeout < 1) logError('Option "timeout" must be Greater than 0!');
        if (options.caseSensitive && (typeof options.caseSensitive !== "boolean")) logError('Option "caseSensitive" must be of type boolean!');
        if (options.customPromptEmbed && (typeof options.customPromptEmbed === "string")) logError('Option "customPromptEmbed" is not an instance of EmbedBuilder!');
        if (options.customSuccessEmbed && (typeof options.customSuccessEmbed === "string")) logError('Option "customSuccessEmbed" is not an instance of EmbedBuilder!');
        if (options.customFailureEmbed && (typeof options.customFailureEmbed === "string")) logError('Option "customFailureEmbed" is not an instance of EmbedBuilder!');

        options.attempts = options.attempts || 1;
        if (options.caseSensitive === undefined) options.caseSensitive = true;
        options.timeout = options.timeout || 60000;
        if (options.showAttemptCount === undefined) options.showAttemptCount = true;

        Object.assign(this.options, options);
    }

    /**
    * Presents the CAPTCHA to a `Discord.GuildMember`.
    * 
    * @param {GuildMember} member The Discord Server Member to Present the CAPTCHA to.
    * @param {CaptchaImageData} [customCaptcha=undefined] **(OPTIONAL):** An object consisting of a Custom CAPTCHA Image and Text Answer.
    * @returns {Promise<Boolean>} Whether or not the Member Successfully Solved the CAPTCHA.
    * @async
    * @example
    * const { Captcha } = require("discord.js-captcha"); 
    * 
    * const captcha = new Captcha(client, {
    *     roleID: "Role ID Here",
    *     channelID: "Text Channel ID Here",
    *     sendToTextChannel: false,
    *     kickOnFailure: true,
    *     caseSensitive: true,
    *     attempts: 3,
    *     timeout: 30000,
    *     showAttemptCount: true,
    *     customPromptEmbed: new EmbedBuilder(),
    *     customSuccessEmbed: new EmbedBuilder(),
    *     customFailureEmbed: new EmbedBuilder(),
    * });
    * 
    * client.on("guildMemberAdd", async member => {
    *     captcha.present(member);
    * });
    */
    async present(member, customCaptcha) {
        if (!member) logError("No Discord Member was Provided!");
        if (customCaptcha) {
            if (!customCaptcha.image) logError("Custom Captcha Image Data does not include an Image Buffer!");
            if (!customCaptcha.text) logError("Custom Captcha Image Data does not include a Text Answer!");
            if (!Buffer.isBuffer(customCaptcha.image)) logError("Custom Captcha Image is not a Buffer!");
            if (typeof customCaptcha.text !== "string") logError("Custom Captcha Text is not of type String!");
        }
        const user = member.user;
        const captcha = customCaptcha ? customCaptcha : await createCaptcha(6, this.options.caseSensitive ? "" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        let attemptsLeft = this.options.attempts || 1;
        let attemptsTaken = 1;
        let captchaResponses = [];

        let captchaIncorrect = new EmbedBuilder()
            .setTitle("❌ You Failed to Complete the CAPTCHA!")
            .setDescription(`${member.user}, you failed to solve the CAPTCHA!\n\nCAPTCHA Text: **${captcha.text}**`)
            .setTimestamp()
            .setColor("Red")
            .setThumbnail(member.guild.iconURL({ dynamic: true }))

        if (this.options.customFailureEmbed) captchaIncorrect = this.options.customFailureEmbed

        let captchaCorrect = new EmbedBuilder()
            .setTitle("✅ CAPTCHA Solved!")
            .setDescription(`${member.user}, you completed the CAPTCHA successfully, and you have been given access to **${member.guild.name}**!`)
            .setTimestamp()
            .setColor("Green")
            .setThumbnail(member.guild.iconURL({ dynamic: true }))

        if (this.options.customSuccessEmbed) captchaCorrect = this.options.customSuccessEmbed

        let captchaPrompt = new EmbedBuilder()
            .setTitle(`Welcome to ${member.guild.name}!`)
            .addFields([{ name: "I'm Not a Robot", value: `${member.user}, to gain access to **${member.guild.name}**, please solve the CAPTCHA below!\n\nThis is done to protect the server from raids consisting of spam bots.` }])
            .setColor("Random")
            .setThumbnail(member.guild.iconURL({ dynamic: true }))

        if (this.options.customPromptEmbed) captchaPrompt = this.options.customPromptEmbed
        if (this.options.showAttemptCount) captchaPrompt.setFooter({ text: this.options.attempts == 1 ? "You have one attempt to solve the CAPTCHA." : `Attempts Left: ${attemptsLeft}` })
        captchaPrompt.setImage('attachment://captcha.png')

        await handleChannelType(this.client, this.options, member).then(async channel => {
            let captchaEmbed;
            if ((this.options.channelID) && this.options.sendToTextChannel == true) {
                channel = (await this.client.guilds.fetch(member.guild.id)).channels.resolve(this.options.channelID)
                captchaEmbed = await channel.send({
                    embeds: [captchaPrompt],
                    files: [
                        { name: "captcha.png", attachment: captcha.image }
                    ]
                })
            } else {
                try {
                    channel = await user.createDM()
                    captchaEmbed = await channel.send({
                        embeds: [captchaPrompt],
                        files: [
                            { name: "captcha.png", attachment: captcha.image }
                        ]
                    })
                } catch (error) {
                    logWarning("Failed to send CAPTCHA via DM.", error);
                    if (this.options.channelID) {
                        channel = (await this.client.guilds.fetch(member.guild.id)).channels.resolve(this.options.channelID)
                        captchaEmbed = await channel.send({
                            embeds: [captchaPrompt],
                            files: [
                                { name: "captcha.png", attachment: captcha.image }
                            ]
                        })
                    } else {
                        return logWarning(`User's Direct Messages are Locked!\nYou can attempt have the CAPTCHA sent to a Text Channel if it can't send to DMs by using the "channelID" Option in the Constructor.`);
                    }
                }
            }

            const captchaFilter = x => {
                return (x.author.id == member.user.id)
            }

            async function handleAttempt(captchaData) { //Handles CAPTCHA Responses and Checks
                await captchaEmbed.channel.awaitMessages({
                    filter: captchaFilter, max: 1, time: captchaData.options.timeout
                })
                    .then(async responses => {

                        if (!responses.size) { //If no response was given, CAPTCHA is fully cancelled here

                            //emit timeout event
                            captchaData.emit("timeout", {
                                member: member,
                                responses: captchaResponses,
                                attempts: attemptsTaken,
                                captchaText: captcha.text,
                                captchaOptions: captchaData.options
                            })

                            await captchaEmbed.delete();
                            if (channel.type === ChannelType.GuildText) {
                                await channel.send({ embeds: [captchaIncorrect] })
                                    .then(async msg => {
                                        if (captchaData.options.kickOnFailure) await member.kick("Failed to Pass CAPTCHA")
                                        setTimeout(() => msg.delete(), 3000);
                                    });
                            } else {
                                try {
                                    await channel.send({ embeds: [captchaIncorrect] })
                                    if (captchaData.options.kickOnFailure) await member.kick("Failed to Pass CAPTCHA")
                                } catch (error) {
                                    logWarning("Failed to send DM timeout notice.", error);
                                }
                            }
                            return false;
                        }

                        //emit answer event
                        captchaData.emit("answer", {
                            member: member,
                            response: String(responses.first()),
                            attempts: attemptsTaken,
                            captchaText: captcha.text,
                            captchaOptions: captchaData.options
                        })

                        let answer = String(responses.first()); //Converts the response message to a string
                        if (captchaData.options.caseSensitive !== true) answer = answer.toLowerCase(); //If the CAPTCHA is case sensitive, convert the response to lowercase
                        captchaResponses.push(answer); //Adds the answer to the array of answers
                        if (channel.type === ChannelType.GuildText) await responses.first().delete();

                        if (answer === captcha.text) { //If the answer is correct, this code will execute
                            //emit success event
                            captchaData.emit("success", {
                                member: member,
                                responses: captchaResponses,
                                attempts: attemptsTaken,
                                captchaText: captcha.text,
                                captchaOptions: captchaData.options
                            })
                            if (captchaData.options.roleID) {
                                await member.roles.add(captchaData.options.roleID)
                            }
                            if (channel.type === ChannelType.GuildText) {
                                await captchaEmbed.delete();
                                channel.send({ embeds: [captchaCorrect] })
                                    .then(async msg => {
                                        setTimeout(() => msg.delete(), 3000);
                                    });
                            } else {
                                try {
                                    await channel.send({ embeds: [captchaCorrect] })
                                } catch (error) {
                                    logWarning("Failed to send DM success message.", error);
                                }
                            }
                            return true;
                        } else { //If the answer is incorrect, this code will execute
                            if (attemptsLeft > 1) { //If there are attempts left
                                attemptsLeft--;
                                attemptsTaken++;
                                if (channel.type === ChannelType.GuildText && captchaData.options.showAttemptCount) {
                                    await captchaEmbed.edit({
                                        embeds: [captchaPrompt.setFooter({ text: `Attempts Left: ${attemptsLeft}` })],
                                        files: [
                                            { name: "captcha.png", attachment: captcha.image }
                                        ]
                                    })
                                }
                                else if (channel.type !== ChannelType.GuildText) {
                                    try {
                                        await captchaEmbed.channel.send({
                                            embeds: [captchaData.options.showAttemptCount ? captchaPrompt.setFooter({ text: `Attempts Left: ${attemptsLeft}` }) : captchaPrompt],
                                            files: [
                                                { name: "captcha.png", attachment: captcha.image }
                                            ]
                                        })
                                    } catch (error) {
                                        logWarning("Failed to send DM attempt prompt.", error);
                                    }
                                }
                                return handleAttempt(captchaData);
                            }
                            //If there are no attempts left

                            //emit failure event
                            captchaData.emit("failure", {
                                member: member,
                                responses: captchaResponses,
                                attempts: attemptsTaken,
                                captchaText: captcha.text,
                                captchaOptions: captchaData.options
                            })

                            if (channel.type === ChannelType.GuildText) {
                                await captchaEmbed.delete();
                                await channel.send({ embeds: [captchaIncorrect] })
                                    .then(async msg => {
                                        if (captchaData.options.kickOnFailure) await member.kick("Failed to Pass CAPTCHA")
                                        setTimeout(() => msg.delete(), 3000);
                                    });
                            } else {
                                try {
                                    await channel.send({ embeds: [captchaIncorrect] })
                                    if (captchaData.options.kickOnFailure) await member.kick("Failed to Pass CAPTCHA")
                                } catch (error) {
                                    logWarning("Failed to send DM failure notice.", error);
                                }
                            }
                            return false;
                        }
                    })
            }
            //emit prompt event
            this.emit("prompt", {
                member: member,
                captchaText: captcha.text,
                captchaOptions: this.options
            })
            handleAttempt(this);
        })
    }
}

module.exports = Captcha;