var rhit = rhit ||{};

rhit.FB_COLLECTION_CHARACTER = "Characters";
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

rhit.fbCharactersManager  = null;
rhit.fbAuthManager = null;

var deathSuccess = 0;
var deathFail = 0;

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

	beginListening(changeListener){
		firebase.auth().onAuthStateChanged((user)=> {
			this._user = user;
			changeListener();
		});
	}

	signIn(){
		rhit.startFirebaseUI();
	}

	signOut() {
		firebase.auth().signOut().catch(function(error){
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

rhit.checkForRedirects = function(){

	if(document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn){
		window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
	}

	if(!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn){
		window.location.href ="/";
	}
};

	
rhit.initalizePage = function(){
	
	if(document.querySelector("#listPage")){
		const urlParams = new URLSearchParams(window.location.search);
		console.log("You are on the list page");

		const uid = urlParams.get("uid");

		rhit.fbCharactersManager = new rhit.FbCharactersManager(uid);
		new rhit.ListPageController();

	}

	if(document.querySelector("#loginPage")){
		console.log("You are on the login page");
		new rhit.LoginPageController();

	}

	if(document.querySelector("#characterSheet")) {
		console.log("You are on the chacter sheet");
		new rhit.CharacterPageController();
	}
};

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
		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED,"desc").limit(50);
		if(this._uid){
			query=  query.where(rhit.FB_KEY_AUTHOR,"==",this._uid);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot)=>{
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

   rhit.Character = class {
	constructor(id,name, mainclass, subclass) {
	  this.id = id;
	  this.name = name;
	  this.mainclass = mainclass;
	  this.subclass = subclass;
	}
   }

   rhit.ListPageController = class {
	constructor() {

		document.querySelector("#menuShowMyCharacter").addEventListener("click",(event)=>{

			window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
		});
		document.querySelector("#menuSignOut").addEventListener("click",(event)=>{
			rhit.fbAuthManager.signOut();
		});

		document.querySelector("#submitAddCharacter").addEventListener("click",(event)=>{
			const name = document.querySelector("#inputName").value;
			const mainclass = document.querySelector("#inputMainClass").value;
			const subclass = document.querySelector("#inputSubClass").value;
			rhit.fbCharactersManager.add(name, mainclass,subclass);
			console.log("test");
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
	_createCard(character){
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
		for(let i =0;i<rhit.fbCharactersManager.length;i++){
			const mq = rhit.fbCharactersManager.getCharacterAtIndex(i);
			const newCard = this._createCard(mq);

			newCard.onclick = (event)=>{
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
	constructor(){
		rhit.fbAuthManager.signIn();
		
	}
}

// character sheet page

rhit.CharacterPageController = class{
	constructor(){
		
		document.querySelector("#signOutButton").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}

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
		document.querySelector("#str > #statInc").onclick = (event) => {
			this.updateView();
		}

		// rhit.fbSingleQuoteManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		// document.querySelector("#strValue").innerHTML = ;
	}
}

// rhit.fbSingleQuoteManager = class{
// 	constructor(movieQuoteId) {
// 		this._documentSnapshot = {}
// 		this._unsubscribe = null;
// 		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_MOVIEQUOTE).doc(movieQuoteId);
// 	}

// 	beginListening(changeListener) {
// 		this._unsubscribe = this._ref.onSnapshot((doc) => {
// 			if(doc.exists){		
// 				console.log("Document data:", doc.data());
// 				this._documentSnapshot = doc;
// 				changeListener();
// 			} else{
// 				console.log("No such document");
// 			}
// 		});
// 	}

// 	stopListening() {
// 		this._unsubscribe();
// 	}

// 	update(quote, movie){
// 		this._ref.update({
// 			[rhit.FB_KEY_QUOTE]: quote,
// 			[rhit.FB_KEY_MOVIE]: movie,
// 			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
// 		})
// 		.then(function() {
// 		})
// 		.catch(function(error) {
// 		});
// 	}

// 	delete() {
// 		return this._ref.delete()
// 	}

// 	get quote() {
// 		return this._documentSnapshot.get(rhit.FB_KEY_QUOTE);
// 	}
// 	get movie() {
// 		return this._documentSnapshot.get(rhit.FB_KEY_MOVIE);
// 	}
// 	get author() {
// 		return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
// 	}
// }

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

 rhit.startFirebaseUI = function(){
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
