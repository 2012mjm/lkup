const persianJs = require('persianjs')
const Hashids = require("hashids")

let self = module.exports = {

	fixDigit: (value) => {
		const englishNumbers 	= ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
		const persianNumbers 	= ["۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹", "۰"]
		const arabicNumbers 	= ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "٠"]

		for (var i = 0, numbersLen = persianNumbers.length; i < numbersLen; i++) {
				value = value.replace(new RegExp(persianNumbers[i], "g"), englishNumbers[i])
				value = value.replace(new RegExp(arabicNumbers[i], "g"), englishNumbers[i])
		}
		return value
	},

	fixArabicChar: (value) => {
    const arabicChars = ["ي", "ك", "‍", "دِ", "بِ", "زِ", "ذِ", "ِشِ", "ِسِ", "‌", "ى"]
		const persianChars = ["ی", "ک", "", "د", "ب", "ز", "ذ", "ش", "س", "", "ی"]

    for (var i = 0, charsLen = arabicChars.length; i < charsLen; i++) {
        value = value.replace(new RegExp(arabicChars[i], "g"), persianChars[i])
    }
    return value
	},

  price: (value, unit='تومان') => {
    let str = value.toString()
    if (str.length >= 4) {
      str = str.replace(/(\d)(?=(\d{3})+)/g, '$1,')
    }
    return `${persianJs(str).englishNumber().toString()} ${unit}`
  },

  persianNum: (value) => {
    return persianJs(value.toString()).englishNumber().toString()
  },

  seperate3Digit: (value) => {
		let str = value.toString()
    if (str.length >= 4) {
      str = str.replace(/(\d)(?=(\d{3})+)/g, '1,')
    }
		return str
  },

  duration: (value) => {
	  let durationUnit

	  if(value >= 3600*24*7) {
      durationUnit = 'هفته'
      value /= 3600*24*7
    }
    else if(value >= 3600*24) {
      durationUnit = 'روز'
      value /= 3600*24
    }
    else if(value >= 3600) {
      durationUnit = 'ساعت'
      value /= 3600
    }
    else if(value >= 60) {
      durationUnit = 'دقیقه'
      value /= 60
    }

    return `{self.persianNum(value)} {durationUnit}`
  },

	memberCountFix: (value) => {
		if(value >= 1000000 ) {
			return (Math.round( value / 1000000 * 10 ) / 10) + ' میلیون'
		}
		else if(value >= 1000) {
			return (Math.round( value / 1000 * 10 ) / 10) + ' هزار'
		}
		else if(value >= 100) {
			return (Math.round( value / 100 ) * 100)
		}
		else if(value >= 10) {
			return (Math.round( value / 10 ) * 10)
		}
		else {
			return value
		}
	},

	paginationInlineKeyboard: (count, limit=5, perfixCallback='', currentPage=1) => {
	  const pageCount = Math.ceil(count / limit)

	  if(pageCount <= 1) {
	    return null
	  }

	  let pagination = []
		if(currentPage !== 1) {
	    pagination.push({
	      text: '«',
	      callback_data: perfixCallback + (currentPage-1)
	    })
		}
		if(currentPage !== pageCount) {
	    pagination.push({
	      text: '»',
	      callback_data: perfixCallback + (currentPage+1)
	    })
		}
	  return [pagination]
	},

	starGenerate: (vote) => {
		if(vote === 0) return null

		let star = ''
		if(vote < 1) vote = 1
		for(let i=1; i<=Math.round(vote); i++) {
			star += '⭐️'
		}
		return star
	},

	encrypt: (value, key='channelBot', length=5) => {
	  const hashids = new Hashids(key, length, 'abcdefghijklmnopqrstuvwxyz0123456789')
	  return hashids.encode(value)
	},

	decrypt: (value, key='channelBot', length=5) => {
	  const hashids = new Hashids(key, length, 'abcdefghijklmnopqrstuvwxyz0123456789')
	  return hashids.decode(value)[0]
	},

	randomGen: (len=5) => {
    let text = ''
    let charset = 'abcdefghijklmnopqrstuvwxyz0123456789'
    for(let i=0; i < len; i++) {
			text += charset.charAt(Math.floor(Math.random() * charset.length))
		}
    return text
	},

	wordState: (word, matchSimilar=true) => {
		word = word.trim()
		let expWord = word.split(' ')
		let countWord = expWord.length
		let states = []

		if(countWord > 1) {
			states.push({
				word: word,
				weight: 640*countWord,
			})
			states.push({
				word: word+' %',
				weight: 384*countWord,
			})
			states.push({
				word: '% '+word,
				weight: 256*countWord,
			})
			states.push({
				word: '% '+word+' %',
				weight: 128*countWord,
			})
		}

		expWord.forEach(singleWord => {
			states.push({
				word: singleWord,
				weight: 64*countWord,
			})
			states.push({
				word: singleWord+' %',
				weight: 32*countWord,
			})
			states.push({
				word: '% '+singleWord,
				weight: 16*countWord,
			})
			states.push({
				word: '% '+singleWord+' %',
				weight: 8*countWord,
			})

			if(matchSimilar) {
				states.push({
					word: singleWord+'%',
					weight: 4,
				})
				states.push({
					word: '%'+singleWord,
					weight: 2,
				})
				states.push({
					word: '%'+singleWord+'%',
					weight: 1,
				})
			}
		})

		return states
	},

	wordStateQuery: (states, attr, type='+') => {
		let query = []
		states.forEach((state, i) => {
			if(type === '+') {
				query.push(`((${attr} LIKE '${state.word}') * ${state.weight})`)
			}
			else {
				query.push(`(${attr} LIKE '${state.word}')`)
			}
		})
		return query.join(` ${type} `)
	}
}
