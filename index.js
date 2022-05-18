const { App } = require('@slack/bolt');
const modalViewTemplate = require('./modalView');

require('dotenv').config();

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

const getViewData = async (username, viewData) => {
	let userInfo = {};
	var keys = Object.keys(viewData); // ['key1', 'key2']
	keys.forEach(function (key) {
		let values = viewData[key];
		if (values.hasOwnProperty('fun-facts')) {
			userInfo.funfacts = values['fun-facts'].value;
		}
		if (values.hasOwnProperty('location')) {
			userInfo.location = values['location'].selected_option.value;
		}
		if (values.hasOwnProperty('T-Shirt')) {
			userInfo.size = values['T-Shirt'].selected_option.value;
		}
	});
	return userInfo;
};

const getUserName = async (userID, client) => {
	let userData = await client.users.info({ user: userID });
	try {
		return userData.user.real_name;
	} catch (error) {
		logger.error(error);
	}
};

app.event('member_joined_channel', async ({ event, body }) => {
	if (event.channel === process.env.SLACK_WELCOME_CHANNEL) {
		app.message('', async ({ message, say }) => {
			// Welcome message for the new employee
			await say({
				blocks: [
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: `Welcome to the company party channel <@${message.user}>, we're so excited you are here! \nPlease click the START button on the right to tell us a little more about yourself :)`
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
				text: `Welcome to the company party channel <@${message.user}>, we're so excited you are here! Please click the START button on the right to tell us a little more about yourself :)`
			});
		});
	}
});

app.action('partymodal_open', async ({ body, ack, client, logger }) => {
	await ack();
	let userRealName = await getUserName(body.user.id, client);
	const modalTemplate = modalViewTemplate(body.trigger_id, userRealName);
	try {
		const result = await client.views.open(modalTemplate);
	} catch (error) {
		logger.error(error);
	}
});

app.view('party-details', async ({ ack, body, view, client, logger }) => {
	// get user name from SLACK API
	let userRealName = await getUserName(body.user.id, client);
	let submissionData = await getViewData(userRealName, view.state.values);

	// add notifications to the channels
	try {
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
	} catch (error) {
		logger.error(error);
	}
	await ack(); // Acknowledge the view_submission request
});

// TODO to change to Direct Message
app.view({ callback_id: 'party-details', type: 'view_closed' }, ({ view, logger, client }) => {
	//let userRealName = await getUserName(body.user.id);
	try {
		// Ask user to re-consider filling out the form
		client.chat.postMessage({
			channel: process.env.SLACK_WELCOME_CHANNEL,
			text: `Make sure you take a chance to fill out the form so we can make sure we have the best party ever! \nThanks!`
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
