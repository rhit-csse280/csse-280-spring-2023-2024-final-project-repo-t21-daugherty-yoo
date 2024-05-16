var rhit = rhit || {};

rhit.FB_COLLECTION_CHARACTER = "Characters";
rhit.FB_COLLECTION_COMPANIONS = "companions";
rhit.FB_COLLECTION_SPELLS = "spells";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_MAINCLASS = "mainclass";
rhit.FB_KEY_SUBCLASS = "subclass";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_AUTHOR = "author";
rhit.FB_KEY_STR = "str";
rhit.FB_KEY_DEX = "dex";
rhit.FB_KEY_CON = "con";
rhit.FB_KEY_INT = "int";
rhit.FB_KEY_WIS = "wis";
rhit.FB_KEY_CHA = "cha";
rhit.FB_KEY_HP = "hp";
rhit.FB_KEY_MAX_HP = "maxHP";
rhit.FB_KEY_TEMP_HP = "tempHP";
rhit.FB_KEY_AC = "ac";
rhit.FB_KEY_SPEED = "speed";
rhit.FB_KEY_PROFICIENCY = "proficiency";
rhit.FB_KEY_SPELLNAME = "spellName";
rhit.FB_KEY_SPELLLEVEL = "spellLevel";
rhit.FB_KEY_COMPANION_NAME = "companionName";
rhit.FB_KEY_COMPANION_HP = "companionHP";
rhit.FB_KEY_CHARACTERID = "characterID";

rhit.fbCharactersManager = null;
rhit.fbSingleCharacterManager = null;
rhit.fbSingleSpellManager = null;
rhit.fbSingleCompanionManager = null;
rhit.fbAuthManager = null;

var deathSuccess = 0;
var deathFail = 0;
var firstLvlSpells = 0;
var secondLvlSpells = 0;
var thirdLvlSpells = 0;
var fourthLvlSpells = 0;
var fifthLvlSpells = 0;
var sixthLvlSpells = 0;
var seventhLvlSpells = 0;
var eighthLvlSpells = 0;
var ninthLvlSpells = 0;


function check(checkbox) {
	if (checkbox.checked) {
		//   alert("checked");
		checkbox.checked = true;
		rhit.fbSingleCharacterManager
	} else {
		//   alert("You didn't check it! Let me check it for you.");
		checkbox.checked = false;
	}
}

//From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}

	signIn() {
		rhit.startFirebaseUI();
	}

	signOut() {
		firebase.auth().signOut().catch(function (error) {
			console.log("Sign out error");
		});
	}

	get isSignedIn() {
		return !!this._user;
	}

	get uid() {
		return this._user.uid;
	}

};

rhit.checkForRedirects = function () {

	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
	}

	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}
};


rhit.initalizePage = function () {

	if(document.querySelector("#spellPage")) {
		const urlParams = new URLSearchParams(window.location.search);
		console.log("You are on the spell page");

		const characterId = urlParams.get('id');

		if (!characterId) {
			console.log("Error: Missing character id");
			window.location.href = "/";
		}

		rhit.fbSingleSpellManager = new rhit.fbSingleSpellManager(characterId);
		new rhit.SpellPageController();

	}

	if(document.querySelector("#companionPage")) {
		const urlParams = new URLSearchParams(window.location.search);
		console.log("You are on the companion page");

		const characterId = urlParams.get('id');

		if (!characterId) {
			console.log("Error: Missing character id");
			window.location.href = "/";
		}

		rhit.fbSingleCompanionManager = new rhit.fbSingleCompanionManager(characterId);
		new rhit.CompanionPageController();

	}

	if (document.querySelector("#listPage")) {
		const urlParams = new URLSearchParams(window.location.search);
		console.log("You are on the list page");

		const uid = urlParams.get("uid");

		rhit.fbCharactersManager = new rhit.FbCharactersManager(uid);
		new rhit.ListPageController();

	}


	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page");
		new rhit.LoginPageController();

	}

	if (document.querySelector("#characterSheet")) {
		const urlParams = new URLSearchParams(window.location.search);
		console.log("You are on the chacter sheet");

		const characterId = urlParams.get('id');

		if (!characterId) {
			console.log("Error: Missing character id");
			window.location.href = "/";
		}

		rhit.fbSingleCharacterManager = new rhit.fbSingleCharacterManager(characterId);
		new rhit.CharacterPageController();
	}
};

//companion page
rhit.fbSingleCompanionManager = class {
	constructor(characterID){
		this._characterId = characterID;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_CHARACTER).doc(characterID).collection(rhit.FB_COLLECTION_COMPANIONS);
		this._unsubscribe = null;
	}
	add(name,hp){
		this._ref.add({
			[rhit.FB_KEY_COMPANION_NAME]: name,
			[rhit.FB_KEY_COMPANION_HP]: hp,
			[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		}).then(function (docRef) {
			console.log("Document added with ID: ", docRef.id);
		})
		.catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}

	beginListening(changeListener) {

		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;

			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length;
	}
	getCharacterAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const mq = new rhit.Companion(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_COMPANION_NAME),
			docSnapshot.get(rhit.FB_KEY_COMPANION_HP));

		return mq;
	}
	get ids() {
		return this._characterId;
	}
}

rhit.CompanionPageController = class {
	constructor(){
		document.querySelector("#menuShowMyCharacter").addEventListener("click", (event) => {

			window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
		});
		// Sign Out
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#spellsButton").addEventListener("click", (event) => {
			window.location.href = `/spells.html?id=${rhit.fbSingleCompanionManager.ids}`;
		});
		document.querySelector("#charactersButton").addEventListener("click", (event) => {
			window.location.href = `/character.html?id=${rhit.fbSingleCompanionManager.ids}`;
		});

		document.querySelector("#submitAddCompanion").addEventListener("click", (event) => {
			const name = document.querySelector("#inputCompanionName").value;
			const hp = document.querySelector("#inputCompanionHP").value;
			rhit.fbSingleCompanionManager.add(name, hp);
		});

		$("#addCompanionDialog").on("show.bs.modal", () => {
			document.querySelector("#inputCompanionName").value = "";
			document.querySelector("#inputCompanionHP").value = "";
		});

		$("#addCompanionDialog").on("shown.bs.modal", () => {
			document.querySelector("#inputCompanionName").focus();
		});

		rhit.fbSingleCompanionManager.beginListening(this.updateList.bind(this));

	}

	_createCard(companion) {
		return htmlToElement(`<div class="card">
		<div class="card-body">
		  <h5 class="card-title">${companion.name}</h5>
		  <p class="card-text">${companion.hp}</p>
		</div>
	  </div>`);
	}

	updateList() {
		const newList = htmlToElement("<div id='companionListContainer'></div>")
		console.log(rhit.fbSingleCompanionManager.length);
		for (let i = 0; i < rhit.fbSingleCompanionManager.length; i++) {
			const mq = rhit.fbSingleCompanionManager.getCharacterAtIndex(i);
			const newCard = this._createCard(mq);

			newCard.onclick = (event) => {
				window.location.href = `/companions.html?id=${mq.id}`;
			};

			newList.appendChild(newCard);
		}
		const oldList = document.querySelector("#companionListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}
}

//spell page
rhit.fbSingleSpellManager = class {
	constructor(characterID) {
		this._characterId = characterID;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_CHARACTER).doc(characterID).collection(rhit.FB_COLLECTION_SPELLS);
		this._unsubscribe = null;
	}
	add(name,level){
		this._ref.add({
			[rhit.FB_KEY_SPELLNAME]: name,
			[rhit.FB_KEY_SPELLLEVEL]: level,
			[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		}).then(function (docRef) {
			console.log("Document added with ID: ", docRef.id);
		})
		.catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}

	beginListening(changeListener) {

		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;

			changeListener();
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	get length() {
		return this._documentSnapshots.length;
	}
	getCharacterAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const mq = new rhit.Spell(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_SPELLNAME),
			docSnapshot.get(rhit.FB_KEY_SPELLLEVEL));

		return mq;
	}

	get ids() {
		return this._characterId;
	}

}

rhit.SpellPageController = class {
	constructor() {
		document.querySelector("#menuShowMyCharacter").addEventListener("click", (event) => {

			window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
		});
		// Sign Out
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#characterButton").addEventListener("click", (event) => {
			window.location.href = `/character.html?id=${rhit.fbSingleSpellManager.ids}`;
		});
		document.querySelector("#companionsButton").addEventListener("click", (event) => {
			window.location.href = `/companions.html?id=${rhit.fbSingleSpellManager.ids}`;
		});
		
		document.querySelector("#submitAddSpell").addEventListener("click", (event) => {
			const name = document.querySelector("#inputSpellName").value;
			const level = document.querySelector("#inputSpellLevel").value;
			rhit.fbSingleSpellManager.add(name, level);
		});

		$("#addSpellDialog").on("show.bs.modal", () => {
			document.querySelector("#inputSpellName").value = "";
			document.querySelector("#inputSpellLevel").value = "";
		});

		$("#addSpellDialog").on("shown.bs.modal", () => {
			document.querySelector("#inputSpellName").focus();
		});


		//Spell Slot Buttons
		document.querySelector("#firstInc").onclick = (event) => {
			firstLvlSpells++;
			document.querySelector("#firstSpells").innerHTML = firstLvlSpells;
		}
		document.querySelector("#firstDec").onclick = (event) => {
			if(firstLvlSpells > 0){
				firstLvlSpells--;
				document.querySelector("#firstSpells").innerHTML = firstLvlSpells;
			}
		}

		document.querySelector("#secondInc").onclick = (event) => {
			secondLvlSpells++;
			document.querySelector("#secondSpells").innerHTML = secondLvlSpells;
		}
		document.querySelector("#secondDec").onclick = (event) => {
			if(secondLvlSpells > 0){
				secondLvlSpells--;
				document.querySelector("#secondSpells").innerHTML = secondLvlSpells;
			}
		}

		document.querySelector("#thirdInc").onclick = (event) => {
			thirdLvlSpells++;
			document.querySelector("#thirdSpells").innerHTML = thirdLvlSpells;
		}
		document.querySelector("#thirdDec").onclick = (event) => {
			if(thirdLvlSpells > 0){
				thirdLvlSpells--;
				document.querySelector("#thirdSpells").innerHTML = thirdLvlSpells;
			}
		}

		document.querySelector("#fourthInc").onclick = (event) => {
			fourthLvlSpells++;
			document.querySelector("#fourthSpells").innerHTML = fourthLvlSpells;
		}
		document.querySelector("#fourthDec").onclick = (event) => {
			if(fourthLvlSpells > 0){
				fourthLvlSpells--;
				document.querySelector("#fourthSpells").innerHTML = fourthLvlSpells;
			}
		}

		document.querySelector("#fifthInc").onclick = (event) => {
			fifthLvlSpells++;
			document.querySelector("#fifthSpells").innerHTML = fifthLvlSpells;
		}
		document.querySelector("#fifthDec").onclick = (event) => {
			if(fifthLvlSpells > 0){
				fifthLvlSpells--;
				document.querySelector("#fifthSpells").innerHTML = fifthLvlSpells;
			}
		}

		document.querySelector("#sixthInc").onclick = (event) => {
			sixthLvlSpells++;
			document.querySelector("#sixthSpells").innerHTML = sixthLvlSpells;
		}
		document.querySelector("#sixthDec").onclick = (event) => {
			if(sixthLvlSpells > 0){
				sixthLvlSpells--;
				document.querySelector("#sixthSpells").innerHTML = sixthLvlSpells;
			}
		}

		document.querySelector("#seventhInc").onclick = (event) => {
			seventhLvlSpells++;
			document.querySelector("#seventhSpells").innerHTML = seventhLvlSpells;
		}
		document.querySelector("#seventhDec").onclick = (event) => {
			if(seventhLvlSpells > 0){
				seventhLvlSpells--;
				document.querySelector("#seventhSpells").innerHTML = seventhLvlSpells;
			}
		}

		document.querySelector("#eighthInc").onclick = (event) => {
			eighthLvlSpells++;
			document.querySelector("#eighthSpells").innerHTML = eighthLvlSpells;
		}
		document.querySelector("#eighthDec").onclick = (event) => {
			if(eighthLvlSpells > 0){
				eighthLvlSpells--;
				document.querySelector("#eighthSpells").innerHTML = eighthLvlSpells;
			}
		}
		
		document.querySelector("#ninthInc").onclick = (event) => {
			ninthLvlSpells++;
			document.querySelector("#ninthSpells").innerHTML = ninthLvlSpells;
		}
		document.querySelector("#ninthDec").onclick = (event) => {
			if(ninthLvlSpells > 0){
				ninthLvlSpells--;
				document.querySelector("#ninthSpells").innerHTML = ninthLvlSpells;
			}
		}

		rhit.fbSingleSpellManager.beginListening(this.updateList.bind(this));
	}
	_createCard(spell) {
		return htmlToElement(`<div class="card">
		<div class="card-body">
		  <h5 class="card-title">${spell.name}</h5>
		  <p class="card-text">${spell.level}</p>
		</div>
	  </div>`);
	}
	updateList() {
		const newList = htmlToElement("<div id='spellListContainer'></div>")
		console.log(rhit.fbSingleSpellManager.length);
		for (let i = 0; i < rhit.fbSingleSpellManager.length; i++) {
			const mq = rhit.fbSingleSpellManager.getCharacterAtIndex(i);
			const newCard = this._createCard(mq);
	
			newList.appendChild(newCard);
		}
		const oldList = document.querySelector("#spellListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}
}


//List Page
rhit.FbCharactersManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_CHARACTER);
		this._unsubscribe = null;
	}
	add(name, mainclass, subclass) {
		this._ref.add({
			[rhit.FB_KEY_NAME]: name,
			[rhit.FB_KEY_MAINCLASS]: mainclass,
			[rhit.FB_KEY_SUBCLASS]: subclass,
			[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
			[rhit.FB_KEY_STR]: 10,
			[rhit.FB_KEY_DEX]: 10,
			[rhit.FB_KEY_CON]: 10,
			[rhit.FB_KEY_INT]: 10,
			[rhit.FB_KEY_WIS]: 10,
			[rhit.FB_KEY_CHA]: 10,
			[rhit.FB_KEY_MAX_HP]: 0,
			[rhit.FB_KEY_HP]: 0,
			[rhit.FB_KEY_TEMP_HP]: 0,
			[rhit.FB_KEY_SPEED]: 0,
			[rhit.FB_KEY_AC]: 0,
			[rhit.FB_KEY_PROFICIENCY]: 2,
		})
			.then(function (docRef) {
				console.log("Document added with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.error("Error adding document: ", error);
			});
	}

	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);
		if (this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;

			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length;
	}
	getCharacterAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const mq = new rhit.Character(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_NAME),
			docSnapshot.get(rhit.FB_KEY_MAINCLASS),
			docSnapshot.get(rhit.FB_KEY_SUBCLASS));

		return mq;
	}
}

rhit.Spell = class {
	constructor(id, name, level) {
		this.id = id;
		this.name = name;
		this.level = level;
	}
}

rhit.Companion = class {
	constructor(id, name, hp) {
		this.id = id;
		this.name = name;
		this.hp = hp;
	}
}

rhit.Character = class {
	constructor(id, name, mainclass, subclass) {
		this.id = id;
		this.name = name;
		this.mainclass = mainclass;
		this.subclass = subclass;
	}
}

rhit.ListPageController = class {
	constructor() {

		document.querySelector("#menuShowMyCharacter").addEventListener("click", (event) => {

			window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
		});
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		document.querySelector("#submitAddCharacter").addEventListener("click", (event) => {
			const name = document.querySelector("#inputName").value;
			const mainclass = document.querySelector("#inputMainClass").value;
			const subclass = document.querySelector("#inputSubClass").value;
			rhit.fbCharactersManager.add(name, mainclass, subclass);
		});

		$("#addCharacterDialog").on("show.bs.modal", () => {
			document.querySelector("#inputName").value = "";
			document.querySelector("#inputMainClass").value = "";
			document.querySelector("#inputSubClass").value = "";
		});

		$("#addCharacterDialog").on("shown.bs.modal", () => {
			document.querySelector("#inputName").focus();
		});

		rhit.fbCharactersManager.beginListening(this.updateList.bind(this));
	}
	_createCard(character) {
		return htmlToElement(`<div class="card">
		<div class="card-body">
		  <h5 class="card-title">${character.name}</h5>
		  <p class="card-text">${character.mainclass}</p>
		  <p class="card-text">${character.subclass}</p>
		</div>
	  </div>`);
	}
	updateList() {
		const newList = htmlToElement("<div id='characterListContainer'></div>")
		for (let i = 0; i < rhit.fbCharactersManager.length; i++) {
			const mq = rhit.fbCharactersManager.getCharacterAtIndex(i);
			const newCard = this._createCard(mq);

			newCard.onclick = (event) => {
				window.location.href = `/character.html?id=${mq.id}`;
			};

			newList.appendChild(newCard);
		}
		const oldList = document.querySelector("#characterListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}
}

rhit.LoginPageController = class {
	constructor() {
		rhit.fbAuthManager.signIn();

	}
}

// character sheet page

rhit.CharacterPageController = class {
	constructor() {

		//AC Modal
		$("#editACDialog").on("show.bs.modal", () => {
			document.querySelector("#editAC").value = "";
			document.querySelector("#editAC").focus();
		});

		document.querySelector("#submitEditAC").addEventListener("click", (event) => {
			const ac = document.querySelector("#editAC").value;
			rhit.fbSingleCharacterManager.updateAC(ac);
			this.updateView();
		});

		//Proficiency Modal
		$("#editPBDialog").on("show.bs.modal", () => {
			document.querySelector("#editPB").value = "";
			document.querySelector("#editPB").focus();
		});

		document.querySelector("#submitEditPB").addEventListener("click", (event) => {
			const pb = document.querySelector("#editPB").value;
			rhit.fbSingleCharacterManager.updateProficiency(pb);
			this.updateView();
		});

		//Speed Modal
		$("#editSpeedDialog").on("show.bs.modal", () => {
			document.querySelector("#editSpeed").value = "";
			document.querySelector("#editSpeed").focus();
		});

		document.querySelector("#submitEditSpeed").addEventListener("click", (event) => {
			const speed = document.querySelector("#editSpeed").value;
			rhit.fbSingleCharacterManager.updateSpeed(speed);
			this.updateView();
		});

		//Temp HP Modal
		$("#editTempHPDialog").on("show.bs.modal", () => {
			document.querySelector("#editTempHP").value = "";
			document.querySelector("#editTempHP").focus();
		});

		document.querySelector("#submitEditTempHP").addEventListener("click", (event) => {
			const temp = document.querySelector("#editTempHP").value;
			rhit.fbSingleCharacterManager.updateTempHP(temp);
			this.updateView();
		});

		//Max HP Modal
		$("#editMaxHPDialog").on("show.bs.modal", () => {
			document.querySelector("#editMaxHP").value = "";
			document.querySelector("#editMaxHP").focus();
		});

		document.querySelector("#submitEditMaxHP").addEventListener("click", (event) => {
			const max = document.querySelector("#editMaxHP").value;
			rhit.fbSingleCharacterManager.updateMaxHP(max);
			this.updateView();
		});

		//Current HP Modal
		$("#editHPDialog").on("show.bs.modal", () => {
			document.querySelector("#editHP").value = "";
			document.querySelector("#editHP").focus();
		});

		document.querySelector("#submitEditHP").addEventListener("click", (event) => {
			const hp = document.querySelector("#editHP").value;
			rhit.fbSingleCharacterManager.updateHP(hp);
			this.updateView();
		});


		document.querySelector("#menuShowMyCharacter").addEventListener("click", (event) => {

			window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
		});
		// Sign Out
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#spellsButton").addEventListener("click", (event) => {
			window.location.href = `/spells.html?id=${rhit.fbSingleCharacterManager.ids}`;
		});
		document.querySelector("#companionsButton").addEventListener("click", (event) => {
			window.location.href = `/companions.html?id=${rhit.fbSingleCharacterManager.ids}`;
		});
		// Proficiency
		document.querySelector("#proficiency").onclick = (event) => {
			this.updateView();
		}

		//Death Saves
		document.querySelector("#succInc").onclick = (event) => {
			deathSuccess++;
			document.querySelector("#successCount").innerHTML = `${deathSuccess}`;
		}
		document.querySelector("#failInc").onclick = (event) => {
			deathFail++;
			document.querySelector("#failCount").innerHTML = `${deathFail}`;
		}
		document.querySelector("#deathReset").onclick = (event) => {
			deathSuccess = 0;
			deathFail = 0;
			document.querySelector("#successCount").innerHTML = `${deathSuccess}`;
			document.querySelector("#failCount").innerHTML = `${deathFail}`;
		}

		//Dice Rolling
		document.querySelector("#rollD20").onclick = (event) => {
			document.querySelector("#D20result").innerHTML = Math.floor(Math.random() * 20 + 1)
		}
		document.querySelector("#rollD12").onclick = (event) => {
			document.querySelector("#D12result").innerHTML = Math.floor(Math.random() * 12 + 1)
		}
		document.querySelector("#rollD10").onclick = (event) => {
			document.querySelector("#D10result").innerHTML = Math.floor(Math.random() * 10 + 1)
		}
		document.querySelector("#rollD8").onclick = (event) => {
			document.querySelector("#D8result").innerHTML = Math.floor(Math.random() * 8 + 1)
		}
		document.querySelector("#rollD6").onclick = (event) => {
			document.querySelector("#D6result").innerHTML = Math.floor(Math.random() * 6 + 1)
		}
		document.querySelector("#rollD4").onclick = (event) => {
			document.querySelector("#D4result").innerHTML = Math.floor(Math.random() * 4 + 1)
		}

		//Stat Changes
		document.querySelector("#str > #statInc").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateStr(1);
			this.updateView();
		}
		document.querySelector("#str > #statDec").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateStr(-1);
			this.updateView();
		}
		document.querySelector("#dex > #statInc").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateDex(1);
			this.updateView();
		}
		document.querySelector("#dex > #statDec").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateDex(-1);
			this.updateView();
		}
		document.querySelector("#con > #statInc").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateCon(1);
			this.updateView();
		}
		document.querySelector("#con > #statDec").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateCon(-1);
			this.updateView();
		}
		document.querySelector("#int > #statInc").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateInt(1);
			this.updateView();
		}
		document.querySelector("#int > #statDec").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateInt(-1);
			this.updateView();
		}
		document.querySelector("#wis > #statInc").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateWis(1);
			this.updateView();
		}
		document.querySelector("#wis > #statDec").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateWis(-1);
			this.updateView();
		}
		document.querySelector("#cha > #statInc").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateCha(1);
			this.updateView();
		}
		document.querySelector("#cha > #statDec").onclick = (event) => {
			rhit.fbSingleCharacterManager.updateCha(-1);
			this.updateView();
		}

		rhit.fbSingleCharacterManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		//Name
		document.querySelector("#characterName").innerHTML = rhit.fbSingleCharacterManager.name;
		document.querySelector("#characterClass").innerHTML = rhit.fbSingleCharacterManager.class;
		document.querySelector("#characterSubclass").innerHTML = rhit.fbSingleCharacterManager.subclass;

		//stats
		document.querySelector("#strValue").innerHTML = rhit.fbSingleCharacterManager.str;
		document.querySelector("#dexValue").innerHTML = rhit.fbSingleCharacterManager.dex;
		document.querySelector("#conValue").innerHTML = rhit.fbSingleCharacterManager.con;
		document.querySelector("#intValue").innerHTML = rhit.fbSingleCharacterManager.int;
		document.querySelector("#wisValue").innerHTML = rhit.fbSingleCharacterManager.wis;
		document.querySelector("#chaValue").innerHTML = rhit.fbSingleCharacterManager.cha;

		let prof = rhit.fbSingleCharacterManager.proficiency;

		//info
		document.querySelector("#acValue").innerHTML = rhit.fbSingleCharacterManager.ac;
		document.querySelector("#speedValue").innerHTML = `${rhit.fbSingleCharacterManager.speed}ft`;
		document.querySelector("#pb").innerHTML = `+${rhit.fbSingleCharacterManager.proficiency}`;
		document.querySelector("#initiativeBonus").innerHTML = Math.floor((rhit.fbSingleCharacterManager.dex - 10) / 2);
		document.querySelector("#tempHPValue").innerHTML = rhit.fbSingleCharacterManager.tempHP;
		document.querySelector("#maxHPValue").innerHTML = rhit.fbSingleCharacterManager.maxHP;
		document.querySelector("#currentHPValue").innerHTML = rhit.fbSingleCharacterManager.hp;


		//saving throws
		if (document.getElementById("strProf").checked) {
			document.querySelector("#strModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.str - 10) / 2 + prof)
		} else {
			document.querySelector("#strModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.str - 10) / 2)
		}

		if (document.getElementById("dexProf").checked) {
			document.querySelector("#dexModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.dex - 10) / 2 + prof)
		} else {
			document.querySelector("#dexModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.dex - 10) / 2)
		}

		if (document.getElementById("conProf").checked) {
			document.querySelector("#conModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.con - 10) / 2 + prof)
		} else {
			document.querySelector("#conModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.con - 10) / 2)
		}

		if (document.getElementById("intProf").checked) {
			document.querySelector("#intModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2 + prof)
		} else {
			document.querySelector("#intModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2)
		}

		if (document.getElementById("wisProf").checked) {
			document.querySelector("#wisModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2 + prof)
		} else {
			document.querySelector("#wisModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2)
		}

		if (document.getElementById("chaProf").checked) {
			document.querySelector("#chaModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.cha - 10) / 2 + prof)
		} else {
			document.querySelector("#chaModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.cha - 10) / 2)
		}


		//ability scores
		if (document.getElementById("acrobaticsProf").checked) {
			document.querySelector("#acrobaticsModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.dex - 10) / 2 + prof)
		} else {
			document.querySelector("#acrobaticsModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.dex - 10) / 2)
		}
		if (document.getElementById("animalProf").checked) {
			document.querySelector("#animalModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2 + prof)
		} else {
			document.querySelector("#animalModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2)
		}
		if (document.getElementById("arcanaProf").checked) {
			document.querySelector("#arcanaModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2 + prof)
		} else {
			document.querySelector("#arcanaModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2)
		}
		if (document.getElementById("athleticsProf").checked) {
			document.querySelector("#athleticsModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.str - 10) / 2 + prof)
		} else {
			document.querySelector("#athleticsModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.str - 10) / 2)
		}
		if (document.getElementById("deceptionProf").checked) {
			document.querySelector("#deceptionModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.cha - 10) / 2 + prof)
		} else {
			document.querySelector("#deceptionModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.cha - 10) / 2)
		}
		if (document.getElementById("historyProf").checked) {
			document.querySelector("#historyModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2 + prof)
		} else {
			document.querySelector("#historyModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2)
		}
		if (document.getElementById("insightProf").checked) {
			document.querySelector("#insightModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2 + prof)
		} else {
			document.querySelector("#insightModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2)
		}
		if (document.getElementById("intimidationProf").checked) {
			document.querySelector("#intimidationModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.cha - 10) / 2 + prof)
		} else {
			document.querySelector("#intimidationModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.cha - 10) / 2)
		}
		if (document.getElementById("investigationProf").checked) {
			document.querySelector("#investigationModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2 + prof)
		} else {
			document.querySelector("#investigationModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2)
		}
		if (document.getElementById("medicineProf").checked) {
			document.querySelector("#medicineModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2 + prof)
		} else {
			document.querySelector("#medicineModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2)
		}
		if (document.getElementById("natureProf").checked) {
			document.querySelector("#natureModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2 + prof)
		} else {
			document.querySelector("#natureModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2)
		}
		if (document.getElementById("perceptionProf").checked) {
			document.querySelector("#perceptionModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2 + prof)
		} else {
			document.querySelector("#perceptionModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2)
		}
		if (document.getElementById("performanceProf").checked) {
			document.querySelector("#performanceModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.cha - 10) / 2 + prof)
		} else {
			document.querySelector("#performanceModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.cha - 10) / 2)
		}
		if (document.getElementById("persuasionProf").checked) {
			document.querySelector("#persuasionModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.cha - 10) / 2 + prof)
		} else {
			document.querySelector("#persuasionModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.cha - 10) / 2)
		}
		if (document.getElementById("religionProf").checked) {
			document.querySelector("#religionModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2 + prof)
		} else {
			document.querySelector("#religionModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.int - 10) / 2)
		}
		if (document.getElementById("sleightProf").checked) {
			document.querySelector("#sleightModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.dex - 10) / 2 + prof)
		} else {
			document.querySelector("#sleightModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.dex - 10) / 2)
		}
		if (document.getElementById("stealthProf").checked) {
			document.querySelector("#stealthModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.dex - 10) / 2 + prof)
		} else {
			document.querySelector("#stealthModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.dex - 10) / 2)
		}
		if (document.getElementById("survivalProf").checked) {
			document.querySelector("#survivalModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2 + prof)
		} else {
			document.querySelector("#survivalModifier").innerHTML = Math.floor((rhit.fbSingleCharacterManager.wis - 10) / 2)
		}

	}
}

rhit.fbSingleCharacterManager = class {
	constructor(characterId) {
		this._characterId = characterId;
		this._documentSnapshot = {}
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_CHARACTER).doc(characterId);
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document");
			}
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	updateStr(num) {
		let newValue = this.str + num;
		this._ref.update({
			[rhit.FB_KEY_STR]: newValue
		})
	}
	updateDex(num) {
		let newValue = this.dex + num;
		this._ref.update({
			[rhit.FB_KEY_DEX]: newValue
		})
	}
	updateCon(num) {
		let newValue = this.con + num;
		this._ref.update({
			[rhit.FB_KEY_CON]: newValue
		})
	}
	updateInt(num) {
		let newValue = this.int + num;
		this._ref.update({
			[rhit.FB_KEY_INT]: newValue
		})
	}
	updateWis(num) {
		let newValue = this.wis + num;
		this._ref.update({
			[rhit.FB_KEY_WIS]: newValue
		})
	}
	updateCha(num) {
		let newValue = this.cha + num;
		this._ref.update({
			[rhit.FB_KEY_CHA]: newValue
		})
	}
	updateAC(ac) {
		this._ref.update({
			[rhit.FB_KEY_AC]: ac
		})
	}
	updateProficiency(pb) {
		this._ref.update({
			[rhit.FB_KEY_PROFICIENCY]: pb
		})
	}
	updateSpeed(speed) {
		this._ref.update({
			[rhit.FB_KEY_SPEED]: speed
		})
	}
	updateTempHP(tempHP) {
		this._ref.update({
			[rhit.FB_KEY_TEMP_HP]: tempHP
		})
	}
	updateMaxHP(maxHP) {
		this._ref.update({
			[rhit.FB_KEY_MAX_HP]: maxHP
		})
	}
	updateHP(hp) {
		this._ref.update({
			[rhit.FB_KEY_HP]: hp
		})
	}

	delete() {
		return this._ref.delete()
	}

	get str() {
		return this._documentSnapshot.get(rhit.FB_KEY_STR);
	}
	get dex() {
		return this._documentSnapshot.get(rhit.FB_KEY_DEX);
	}
	get con() {
		return this._documentSnapshot.get(rhit.FB_KEY_CON);
	}
	get int() {
		return this._documentSnapshot.get(rhit.FB_KEY_INT);
	}
	get wis() {
		return this._documentSnapshot.get(rhit.FB_KEY_WIS);
	}
	get cha() {
		return this._documentSnapshot.get(rhit.FB_KEY_CHA);
	}
	get proficiency() {
		return this._documentSnapshot.get(rhit.FB_KEY_PROFICIENCY);
	}
	get speed() {
		return this._documentSnapshot.get(rhit.FB_KEY_SPEED);
	}
	get ac() {
		return this._documentSnapshot.get(rhit.FB_KEY_AC);
	}
	get class() {
		return this._documentSnapshot.get(rhit.FB_KEY_MAINCLASS);
	}
	get subclass() {
		return this._documentSnapshot.get(rhit.FB_KEY_SUBCLASS);
	}
	get name() {
		return this._documentSnapshot.get(rhit.FB_KEY_NAME);
	}
	get tempHP() {
		return this._documentSnapshot.get(rhit.FB_KEY_TEMP_HP);
	}
	get maxHP() {
		return this._documentSnapshot.get(rhit.FB_KEY_MAX_HP);
	}
	get hp() {
		return this._documentSnapshot.get(rhit.FB_KEY_HP);
	}
	get ids() {
		return this._characterId;
	}

}

// end of character sheet


rhit.main = function () {
	console.log("Ready");

	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening((params) => {
		console.log("auth change callback fired");

		rhit.checkForRedirects();

		rhit.initalizePage();
	});

};

rhit.startFirebaseUI = function () {
	var uiConfig = {
		signInOptions: [
			firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			firebase.auth.EmailAuthProvider.PROVIDER_ID,
			firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		],
	};
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', uiConfig);
}


rhit.main();
