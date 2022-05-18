// Modal template - receives trigger_id and username to populate a template object for display

module.exports = (triggerId, userName) => {
	const modalView = {
		trigger_id: triggerId,
		view: {
			type: 'modal',
			callback_id: 'party-details',
			notify_on_close: true,
			title: {
				type: 'plain_text',
				text: `Hi ${userName}!`
			},
			submit: {
				type: 'plain_text',
				text: 'Submit'
			},
			close: {
				type: 'plain_text',
				text: 'Cancel'
			},
			blocks: [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: 'Give us some information to help make our annual work party the best it can possibly be! '
					}
				},
				{
					type: 'divider'
				},
				{
					type: 'input',
					element: {
						type: 'plain_text_input',
						multiline: true,
						action_id: 'fun-facts'
					},
					label: {
						type: 'plain_text',
						text: `${userName}, what are some fun facts about you?`,
						emoji: true
					}
				},
				{
					type: 'input',
					element: {
						type: 'static_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select options',
							emoji: true
						},
						options: [
							{
								text: {
									type: 'plain_text',
									text: 'In the City',
									emoji: true
								},
								value: 'City'
							},
							{
								text: {
									type: 'plain_text',
									text: 'In the country',
									emoji: true
								},
								value: 'Country'
							},
							{
								text: {
									type: 'plain_text',
									text: 'On the coast',
									emoji: true
								},
								value: 'Coast'
							}
						],
						action_id: 'location'
					},
					label: {
						type: 'plain_text',
						text: 'Where would you like to have a work event?',
						emoji: true
					}
				},
				{
					type: 'input',
					element: {
						type: 'static_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select options',
							emoji: true
						},
						options: [
							{
								text: {
									type: 'plain_text',
									text: 'Small',
									emoji: true
								},
								value: 'Small'
							},
							{
								text: {
									type: 'plain_text',
									text: 'Medium',
									emoji: true
								},
								value: 'Medium'
							},
							{
								text: {
									type: 'plain_text',
									text: 'Large',
									emoji: true
								},
								value: 'Large'
							}
						],
						action_id: 'T-Shirt'
					},
					label: {
						type: 'plain_text',
						text: 'T-Shirt Size',
						emoji: true
					}
				}
			]
		}
	};

	return modalView;
};
