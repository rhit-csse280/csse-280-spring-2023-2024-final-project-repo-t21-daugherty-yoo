var rhit = rhit ||{};

rhit.FB_COLLECTION_CHARACTER = "Characters";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_MAINCLASS = "mainclass";
rhit.FB_KEY_SUBCLASS = "subclass";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_AUTHOR = "author";

rhit.fbCharactersManager  = null;
rhit.fbAuthManager = null;

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
