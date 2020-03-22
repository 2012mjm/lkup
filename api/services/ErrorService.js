let self = module.exports = {

	filter: (err) => {
		if(err.invalidAttributes) {
			var output = {};
			if(err.model) {
				var model = sails.models[err.model.toLowerCase()];
				var messages = model.validationMessages;
			}
			var errValid = err.invalidAttributes;

			for (attr in errValid) {
				output[attr] = new Array();
				errValid[attr].forEach((item) => {
					if(messages && messages.hasOwnProperty(attr) && messages[attr].hasOwnProperty(item.rule) && messages[attr][item.rule]) {
						output[attr].push(messages[attr][item.rule]);
					} else {
						output[attr].push(item.message);
					}
				});
			}
			return {errors: output};
		}

		if(_.isArray(err)) {
			return {_errors: err};
		} else {
			return {_errors: [err]};
		}
	},

	toString: (err) => {
		let final = ''
		const out = self.filter(err)

		if(out._errors !== undefined) {
			out._errors.forEach(message => {
				final += `${message}\n`
			})
		}
		else {
			Object.values(out.errors).forEach(messages => {
				messages.forEach(message => {
					final += `${message}\n`
				})
			})
		}

		return final
	}
}
