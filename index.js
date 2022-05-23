const { App } = require('@slack/bolt');
const modalViewTemplate = require('./modalView');

// require('dotenv').config(); // <-- for local testing

// Initializes your app with your bot token and signing secret
const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET
});

// start up app and send init message
(async () => {
	const port = 3000;
	// Start your app
	await app.start(process.env.PORT || port);
	console.log(`Slack Bolt app is running on port ${port}!`);
})();

// Function to return a data object from the modal submission for display and to save to a DB
const getViewData = async (username, viewData) => {
	let submissionInfo = {}; // define object to add submission data to
	const keys = Object.keys(viewData);
	keys.forEach(function (key) {
		let values = viewData[key];
		if (values.hasOwnProperty('fun-facts')) {
			submissionInfo.funfacts = values['fun-facts'].value;
		}
		if (values.hasOwnProperty('location')) {
			submissionInfo.location = values['location'].selected_option.value;
		}
		if (values.hasOwnProperty('T-Shirt')) {
			submissionInfo.size = values['T-Shirt'].selected_option.value;
		}
	});
	return submissionInfo;
};

// Function to get the username of the member open the modal using the SLACK API
const getUserName = async (userID, client) => {
	try {
		const userData = await client.users.info({ user: userID });
		return userData.user.real_name;
	} catch (error) {
		logger.error(error);
	}
};

/* Function to save modal submission data to a external source
const saveDataToExt() => {}
*/

// Welcome message
const channelWelcomeMsg = (username) => {
	return `Welcome to the company party channel <@${username}>, we're so excited you are here! \nPlease click the START button on the right to tell us a little more about yourself :)`;
};

// Event function when a new user joins the channel
app.event('member_joined_channel', async ({ event }) => {
	if (event.channel === process.env.SLACK_WELCOME_CHANNEL) {
		// if the channel a member has joined is the defined Welcome Channel
		app.message('', async ({ message, say }) => {
			// send a message for the new member
			await say({
				blocks: [
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: channelWelcomeMsg(message.user)
						},
						accessory: {
							type: 'button',
							text: {
								type: 'plain_text',
								text: 'START'
							},
							action_id: 'partymodal_open'
						}
					}
				],
				text: channelWelcomeMsg(message.user)
			});
		});
	}
});

// Event function on click of the welcome message button
app.action('partymodal_open', async ({ body, ack, client, logger }) => {
	try {
		await ack(); // Acknowledge the button_click event
		// get user name from SLACK API
		const userRealName = await getUserName(body.user.id, client);
		// set up the modal by using the template >> sending trigger_id and username
		const modalTemplate = modalViewTemplate(body.trigger_id, userRealName);
		await client.views.open(modalTemplate); // open the modal
	} catch (error) {
		logger.error(error);
	}
});

// Event function on submission of modal
app.view('party-details', async ({ ack, body, view, client, logger }) => {
	try {
		// get user name from SLACK API
		const userRealName = await getUserName(body.user.id, client);

		// format the submission data into a dedicated object
		const submissionData = await getViewData(userRealName, view.state.values);

		// Save Submission Data to a DB
		// saveDataToExt(submissionData); <-- add to external source

		// Send a message to the channels
		// Let the party team channel know of the form submission!
		await client.chat.postMessage({
			channel: process.env.SLACK_POST_TO_CHANNEL,
			text: `*${userRealName}* submitted their party details!\n - Fun Facts: _${submissionData.funfacts}_ \n - They would prefer the party is in the *${submissionData.location}* \n - They are a *${submissionData.size}* T-shirt size`
		});
		// Thank the user for filling out the form
		await client.chat.postMessage({
			channel: process.env.SLACK_WELCOME_CHANNEL,
			text: `Thanks ${userRealName} for helping us plan the best party ever! \n*Stay tuned!*`
		});
		await ack(); // Acknowledge the view_submission request
	} catch (error) {
		logger.error(error);
	}
});

// Event function when user cancels the modal without submitting
app.view({ callback_id: 'party-details', type: 'view_closed' }, async ({ body, logger, client }) => {
	try {
		let userRealName = await getUserName(body.user.id, client);

		// Ask user to re-consider filling out the form
		client.chat.postMessage({
			channel: process.env.SLACK_WELCOME_CHANNEL,
			text: `${userRealName}, make sure you take the time to fill out the form so we can make sure we have the best party ever! \nThanks!`
		});
	} catch (error) {
		logger.error(error);
	}
});

/*
Middleware for logging and debugging

app.use((args) => {
	const copiedArgs = JSON.parse(JSON.stringify(args));
	copiedArgs.context.botToken = 'xoxb-***';
	if (copiedArgs.context.userToken) {
		copiedArgs.context.userToken = 'xoxp-***';
	}
	copiedArgs.client = {};
	copiedArgs.logger = {};
	args.logger.info('Dumping request data for debugging...\n\n' + JSON.stringify(copiedArgs, null, 2) + '\n');
	args.next();
});
*/
