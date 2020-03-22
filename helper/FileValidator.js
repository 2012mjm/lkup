module.exports = {

	required: (value) => {
		if(value._files.length > 0) {
		return true;
		}

		value.upload({noop: true});
		return false;
	},

	type: (value, allowedTypes) => {
		if(value._files.length <= 0) return true;
		var file = value._files[0].stream;
		
		if(allowedTypes.indexOf(file.headers['content-type']) !== -1) {
			return true;
		}

		value.upload({noop: true});
		return false;
	},

	size: (value, allowedSize) => {
		if(value._files.length <= 0) return true;
		var file = value._files[0].stream;
		
		if(file.byteCount <= allowedSize) {
			return true;
		}

		value.upload({noop: true});
		return false;
	},
};