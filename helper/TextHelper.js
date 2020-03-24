const persianJs = require("persianjs");
const Hashids = require("hashids");

let self = (module.exports = {
  fixDigit: value => {
    const englishNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
    const persianNumbers = ["۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹", "۰"];
    const arabicNumbers = ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "٠"];

    for (let i = 0, numbersLen = persianNumbers.length; i < numbersLen; i++) {
      value = value.replace(
        new RegExp(persianNumbers[i], "g"),
        englishNumbers[i]
      );
      value = value.replace(
        new RegExp(arabicNumbers[i], "g"),
        englishNumbers[i]
      );
    }
    return value;
  },

  fixArabicChar: value => {
    const arabicChars = [
      "ي",
      "ك",
      "‍",
      "دِ",
      "بِ",
      "زِ",
      "ذِ",
      "ِشِ",
      "ِسِ",
      "‌",
      "ى"
    ];
    const persianChars = ["ی", "ک", "", "د", "ب", "ز", "ذ", "ش", "س", "", "ی"];

    for (const i = 0, charsLen = arabicChars.length; i < charsLen; i++) {
      value = value.replace(new RegExp(arabicChars[i], "g"), persianChars[i]);
    }
    return value;
  },

  price: (value, unit = "تومان") => {
    let str = value.toString();
    if (str.length >= 4) {
      str = str.replace(/(\d)(?=(\d{3})+)/g, "$1,");
    }
    return `${persianJs(str).englishNumber().toString()} ${unit}`;
  },

  persianNum: value => {
    return persianJs(value.toString()).englishNumber().toString();
  },

  seperate3Digit: value => {
    let str = value.toString();
    if (str.length >= 4) {
      str = str.replace(/(\d)(?=(\d{3})+)/g, "1,");
    }
    return str;
  },

  duration: value => {
    let durationUnit;

    if (value >= 3600 * 24 * 7) {
      durationUnit = "هفته";
      value /= 3600 * 24 * 7;
    } else if (value >= 3600 * 24) {
      durationUnit = "روز";
      value /= 3600 * 24;
    } else if (value >= 3600) {
      durationUnit = "ساعت";
      value /= 3600;
    } else if (value >= 60) {
      durationUnit = "دقیقه";
      value /= 60;
    }

    return `{self.persianNum(value)} {durationUnit}`;
  },

  memberCountFix: value => {
    if (value >= 1000000) {
      return Math.round(value / 1000000 * 10) / 10 + " میلیون";
    } else if (value >= 1000) {
      return Math.round(value / 1000 * 10) / 10 + " هزار";
    } else if (value >= 100) {
      return Math.round(value / 100) * 100;
    } else if (value >= 10) {
      return Math.round(value / 10) * 10;
    } else {
      return value;
    }
  },

  paginationInlineKeyboard: (
    count,
    limit = 5,
    perfixCallback = "",
    currentPage = 1
  ) => {
    const pageCount = Math.ceil(count / limit);

    if (pageCount <= 1) {
      return null;
    }

    let pagination = [];
    if (currentPage !== 1) {
      pagination.push({
        text: "«",
        callback_data: perfixCallback + (currentPage - 1)
      });
    }
    if (currentPage !== pageCount) {
      pagination.push({
        text: "»",
        callback_data: perfixCallback + (currentPage + 1)
      });
    }
    return [pagination];
  },

  starGenerate: vote => {
    if (vote === 0) return null;

    let star = "";
    if (vote < 1) vote = 1;
    for (let i = 1; i <= Math.round(vote); i++) {
      star += "⭐️";
    }
    return star;
  },

  encrypt: (value, key = "channelBot", length = 5) => {
    const hashids = new Hashids(
      key,
      length,
      "abcdefghijklmnopqrstuvwxyz0123456789"
    );
    return hashids.encode(value);
  },

  decrypt: (value, key = "channelBot", length = 5) => {
    const hashids = new Hashids(
      key,
      length,
      "abcdefghijklmnopqrstuvwxyz0123456789"
    );
    return hashids.decode(value)[0];
  },

  randomGen: (len = 5) => {
    let text = "";
    let charset = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < len; i++) {
      text += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return text;
  },

  wordState: (word, matchSimilar = true) => {
    word = word.trim();
    let expWord = word.split(" ");
    let countWord = expWord.length;
    let states = [];

    if (countWord > 1) {
      states.push({
        word: word,
        weight: 640 * countWord
      });
      states.push({
        word: word + " %",
        weight: 384 * countWord
      });
      states.push({
        word: "% " + word,
        weight: 256 * countWord
      });
      states.push({
        word: "% " + word + " %",
        weight: 128 * countWord
      });
    }

    expWord.forEach(singleWord => {
      states.push({
        word: singleWord,
        weight: 64 * countWord
      });
      states.push({
        word: singleWord + " %",
        weight: 32 * countWord
      });
      states.push({
        word: "% " + singleWord,
        weight: 16 * countWord
      });
      states.push({
        word: "% " + singleWord + " %",
        weight: 8 * countWord
      });

      if (matchSimilar) {
        states.push({
          word: singleWord + "%",
          weight: 4
        });
        states.push({
          word: "%" + singleWord,
          weight: 2
        });
        states.push({
          word: "%" + singleWord + "%",
          weight: 1
        });
      }
    });

    return states;
  },

  wordStateQuery: (states, attr, type = "+") => {
    let query = [];
    states.forEach((state, i) => {
      if (type === "+") {
        query.push(`((${attr} LIKE '${state.word}') * ${state.weight})`);
      } else {
        query.push(`(${attr} LIKE '${state.word}')`);
      }
    });
    return query.join(` ${type} `);
  },

  nameGenerator: () => {
    const nm1 = [
      "Abbas",
      "Afshin",
      "Ahmad",
      "Akbar",
      "Ali",
      "Ali Reza",
      "Amin",
      "Amir",
      "Amir Ali",
      "Amir Hossein",
      "Amir Mohammad",
      "Amir Reza",
      "Anooshirvan",
      "Arash",
      "Aref",
      "Arman",
      "Arsalan",
      "Arzhang",
      "Asghar",
      "Aziz",
      "Babak",
      "Bagher",
      "Bahman",
      "Bahram",
      "Bairam",
      "Behnam",
      "Behrad",
      "Behrouz",
      "Behzad",
      "Benyamin",
      "Bijan",
      "Borzou",
      "Changiz",
      "Dariush",
      "Davoud",
      "Ebrahim",
      "Ehsan",
      "Enayat",
      "Erfan",
      "Esfandiyar",
      "Esmaeel",
      "Faramarz",
      "Farhad",
      "Fariborz",
      "Farid",
      "Farrokh",
      "Farzad",
      "Farzin",
      "Fazel",
      "Ferdous",
      "Firooz",
      "Freydoun",
      "Habib",
      "Hadi",
      "Hamed",
      "Hamid",
      "Hamidreza",
      "Hashem",
      "Hassan",
      "Hesam",
      "Heshmat",
      "Heydar",
      "Homayoun",
      "Hooman",
      "Hossein",
      "Houshang",
      "Iraj",
      "Jaffar",
      "Jahangir",
      "Jallal",
      "Jamshid",
      "Javad",
      "Kambiz",
      "Kamran",
      "Kamyar",
      "Kannan",
      "Karim",
      "Kaveh",
      "Kazem",
      "Keyhan",
      "Keykavous",
      "Khashayar",
      "Khosrow",
      "Kioumars",
      "Kooroush",
      "Latif",
      "Mahdi",
      "Mahyar",
      "Majid",
      "Mamad",
      "Mani",
      "Manouchehr",
      "Mansour",
      "Mazyar",
      "Mehdi",
      "Mehran",
      "Mehrdad",
      "Meysam",
      "Milad",
      "Moein",
      "Mohammad Ali",
      "Mohammad Reza",
      "Mohsen",
      "Mojtaba",
      "Morteza",
      "Mostafa",
      "Nader",
      "Naghi",
      "Naser",
      "Nima",
      "Nouzar",
      "Nozar",
      "Omid",
      "Parsa",
      "Parviz",
      "Payam",
      "Pejman",
      "Peyman",
      "Pouria",
      "Pouya",
      "Qobad",
      "Ramin",
      "Rasoul",
      "Reza",
      "Rostam",
      "Sadeq",
      "Saeed",
      "Sahand",
      "Salar",
      "Salman",
      "Sam",
      "Saman",
      "Sasan",
      "Sattar",
      "Sepand",
      "Shadmehr",
      "Shahab",
      "Shahin",
      "Shahram",
      "Shapoor",
      "Siamak",
      "Siavash",
      "Sina",
      "Sirvan",
      "Soheil",
      "Sohrab",
      "Soroosh",
      "Taghi",
      "Vahid",
      "Youssef",
      "Zakaria"
    ];
    const nm2 = [
      "Afagh",
      "Afsaneh",
      "Afsoon",
      "Aida",
      "Akhtar",
      "Akram",
      "Anahita",
      "Anna",
      "Aram",
      "Arezoo",
      "Asal",
      "Atefeh",
      "Atena",
      "Athar",
      "Azadeh",
      "Azar",
      "Azita",
      "Bahar",
      "Bahareh",
      "Baran",
      "Behnaz",
      "Behnoosh",
      "Bita",
      "Darya",
      "Dorsa",
      "Ehteram",
      "Elahe",
      "Elham",
      "Elnaz",
      "Fahime",
      "Fakhri",
      "Falamak",
      "Farahnaz",
      "Faranak",
      "Fariba",
      "Farzaneh",
      "Fatemeh",
      "Fereshteh",
      "Foroogh",
      "Frouzan",
      "Ghazal",
      "Gohar",
      "Golchehreh",
      "Goli",
      "Golrokh",
      "Golsa",
      "Hadis",
      "Halimeh",
      "Hamideh",
      "Hanieh",
      "Hannaneh",
      "Hasti",
      "Hedieh",
      "Hengameh",
      "Homa",
      "Jamileh",
      "Katayoun",
      "Khatereh",
      "Khatoun",
      "Kheyri",
      "Kobra",
      "Ladan",
      "Leila",
      "Leyli",
      "Mahboobeh",
      "Mahdieh",
      "Mahnaz",
      "Mahtab",
      "Mahya",
      "Malihe",
      "Maryam",
      "Marzieh",
      "Mehraveh",
      "Melika",
      "Mitra",
      "Mohadese",
      "Mohtaram",
      "Monir",
      "Mozhde",
      "Mozhgan",
      "Naghme",
      "Narges",
      "Nasim",
      "Nasrin",
      "Nassim",
      "Nastaran",
      "Nazanin",
      "Negar",
      "Negin",
      "Niki",
      "Nikou",
      "Niloofar",
      "Ozraa",
      "Parastoo",
      "Pardis",
      "Pari",
      "Parichehr",
      "Parisa",
      "Parvaneh",
      "Parvin",
      "Pegah",
      "Poopak",
      "Pooran",
      "Pouri",
      "Raha",
      "Rahele",
      "Razieh",
      "Reyhaneh",
      "Roohangiz",
      "Roushanak",
      "Rouya",
      "Roya",
      "Saba",
      "Sadaf",
      "Sadiqe",
      "Sahar",
      "Sakineh",
      "Samira",
      "Sara",
      "Setareh",
      "Shabnam",
      "Shahin",
      "Shahla",
      "Shamsi",
      "Shaqayegh",
      "Sharareh",
      "Shila",
      "Shirin",
      "Shiva",
      "Sima",
      "Simin",
      "Soheila",
      "Somayeh",
      "Soraya",
      "Susan",
      "Tahmine",
      "Tannaz",
      "Taraneh",
      "Touran",
      "Vida",
      "Yasaman ",
      "Yekta",
      "Youkhavid",
      "Zahra",
      "Zari",
      "Ziba",
      "Zohreh"
    ];
    const nm3 = [
      "Abbasi",
      "Abdi",
      "Abedi",
      "Adib",
      "Afshani",
      "Afshar",
      "Aghili",
      "Ahangar",
      "Ahmadi",
      "Alidoosti",
      "Almasi",
      "Amini",
      "Arabnia",
      "Arjmand",
      "Asadi",
      "Asayesh",
      "Askari",
      "Aslani",
      "Atlasi",
      "Azadeh",
      "Azari",
      "Baghaii",
      "Bagherzadeh",
      "Bahadori",
      "Bahreini",
      "Barbarz",
      "Bayat",
      "Behdad",
      "Beheshti",
      "Bina",
      "Blourian",
      "Boromand",
      "Bozorgi",
      "Chavoshi",
      "Danesh",
      "Dara",
      "Darvishi",
      "Dehghan",
      "Deljou",
      "Derakhshani",
      "Diba",
      "Dirbaz",
      "Eftekhar",
      "Eghbali",
      "Entezami",
      "Ershadi",
      "Esfahani",
      "Eshtiaq",
      "Eskandari",
      "Faghih",
      "Fallah",
      "Farahani",
      "Faramarzian",
      "Fardin",
      "Farzin",
      "Fathi",
      "Fatollahi",
      "Foroutan",
      "Freydooni",
      "Frootan",
      "Froozan",
      "Gankhaki",
      "Ghaffari",
      "Gharibian",
      "Golchin",
      "Golshani",
      "Golzar",
      "Haghighi",
      "Haghjoo",
      "Haghshenas",
      "Hajar",
      "Hashemi",
      "Hashempour",
      "Hatami",
      "Hayaii",
      "Hayati",
      "Hedayati",
      "Hematti",
      "Heydarpanah",
      "Hosseini",
      "Jabarzadeh",
      "Jafarnejad",
      "Jahangiri",
      "Kamran",
      "Kardan",
      "Karimi",
      "Kasebi",
      "Kashkouli",
      "Kaviani",
      "Keramati",
      "Keshavarz",
      "Khaledi",
      "Khalili",
      "Khodadad",
      "Khoshkam",
      "Khosravi",
      "Kiaei",
      "Kianian",
      "Layegh",
      "Loolaii",
      "Lorestani",
      "Lotfi",
      "Mahdavi",
      "Mahmoodi",
      "Malakooti",
      "Manesh",
      "Mashayekhi",
      "Mehrian",
      "Mehrjoo",
      "Mehrnia",
      "Meskini",
      "Miri",
      "Mirzaii",
      "Modiri",
      "Mofid",
      "Moghadam",
      "Mohebi",
      "Momeni",
      "Moshiri",
      "Mosta'An",
      "Mostofi",
      "Mousavi",
      "Mozafari",
      "Najafi",
      "Nasirian",
      "Nassirian",
      "Nassour",
      "Nazeri",
      "Nemati",
      "Noori",
      "Nouzari",
      "Pahlevan",
      "Pakdel",
      "Panahi",
      "Parastui",
      "Pasdar",
      "Pirdoost",
      "Pirouzfar",
      "Poozesh",
      "Qaderi",
      "Qaedi",
      "Qajar",
      "Qanbari",
      "Qasemi",
      "Raad",
      "Radan",
      "Radish",
      "Raeisi",
      "Rahnema",
      "Raoufi",
      "Rashidi",
      "Rastegar",
      "Rastkar",
      "Rayegan",
      "Razavian",
      "Rezghi",
      "Riahi",
      "Rostami",
      "Rouhani",
      "Sadeghi",
      "Sadiq",
      "Safavi",
      "Saharkhiz",
      "Salehi",
      "Sayyad",
      "Sayyadi",
      "Sehat",
      "Shahi",
      "Shajarian",
      "Shakibaii",
      "Shariati",
      "Shojaii",
      "Shokoohi",
      "Shookohi",
      "Sobhani",
      "Soleymani",
      "Tabasi",
      "Tabatabaii",
      "Taghipour",
      "Taheri",
      "Tahmasb",
      "Tajik",
      "Tarokh",
      "Tarrokh",
      "Tavakoli",
      "Teymoori",
      "Torabi",
      "Vahdat",
      "Vakili",
      "Verdisefat",
      "Vossoughi",
      "Yaghmaei",
      "Yazdani",
      "Yeganeh",
      "Yekta",
      "Zakaria",
      "Zamani",
      "Zand",
      "Zangane",
      "Zareii",
      "Zarqan"
    ];

    rnd2 = Math.floor(Math.random() * nm3.length);
    lastname = nm3[rnd2];

    if (Math.floor(Math.random() * 2) === 1) {
      rnd = Math.floor(Math.random() * nm2.length);
      firstname = nm2[rnd];
      gender = "female";
    } else {
      rnd = Math.floor(Math.random() * nm1.length);
      firstname = nm1[rnd];
      gender = "male";
    }

    return { name: firstname + " " + lastname, firstname, lastname, gender };
  }
});
