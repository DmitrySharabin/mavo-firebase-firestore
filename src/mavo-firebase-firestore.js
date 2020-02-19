(function($, $$) {
	const _ = Mavo.Backend.register(
		$.Class({
			extends: Mavo.Backend,

			id: "Firebase", // an id for the backend

			constructor: function(url, { mavo, format }) {
				// Initialization code
				this.permissions.on(["read", "login"]);

				this.defaults = {
					filename: mavo.id
				};

				this.ready =
					// First of all, we need to download the Firebase core file
					$.load(
						"https://www.gstatic.com/firebasejs/7.8.2/firebase-app.js"
					).then(() => {
						// Then download the other parts
						return Promise.all([
							// Cloud Firestore
							$.load(
								"https://www.gstatic.com/firebasejs/7.8.2/firebase-firestore.js"
							),

							// Cloud Storage
							$.load(
								"https://www.gstatic.com/firebasejs/7.8.2/firebase-storage.js"
							),

							// Authentication
							$.load(
								"https://www.gstatic.com/firebasejs/7.8.2/firebase-auth.js"
							)
						]).then(() => {
							/**
							 * Get all the config info from the url parameter and the corresponding attribute
							 */

							$.extend(this, _.parseURL(url, this.defaults));

							// The app's Firebase configuration
							const config = {
								apiKey: mavo.element.getAttribute("mv-firebase-key"), // FIREBASE API KEY
								databaseURL: this.databaseURL, // DATABASE URL
								projectId: this.projectId, // CLOUD FIRESTORE PROJECT ID
								authDomain: `${this.projectId}.firebaseapp.com`, // FIREBASE AUTH DOMAIN
								storageBucket: `${this.projectId}.appspot.com` // STORAGE BUCKET
							};

							// Initialize Cloud Firestore through Firebase
							// Support using multiple apps on the same page
							if (!firebase.apps.length) {
								this.app = firebase.initializeApp(config);
							} else {
								this.app = firebase.initializeApp(config, mavo.id);
							}

							this.db = firebase.firestore().collection("mavo-apps");

							// Get a reference to the storage service, which is used to create references in the storage bucket,
							// and create a storage reference from the storage service
							this.storageBucketRef = firebase.storage().ref();

							// Get realtime updates
							this.unsubscribe = this.db.doc(this.filename).onSnapshot(
								doc => mavo.render(doc.data()),
								error => mavo.error(`Firebase: ${error.message}`)
							);

							// TODO: Find a place in the code where to unsubscribe
							// this.unsubscribe();

							// Set an authentication state observer and get user data
							firebase.auth().onAuthStateChanged(user => {
								if (user) {
									// User is signed in
									this.user = {
										username: user.email,
										name: user.displayName,
										avatar: user.photoURL,
										...user
									};

									$.fire(mavo.element, "mv-login", { backend: this });

									this.permissions
										.off("login")
										.on(["edit", "add", "delete", "save", "logout"]);
								} else {
									// User is signed out
									this.user = null;

									$.fire(mavo.element, "mv-logout", { backend: this });

									this.permissions
										.off(["edit", "add", "delete", "save", "logout"])
										.on("login");
								}
							});

							return Promise.resolve();
						});
					});

				this.login(true);
			},

			update: function(url, o) {
				this.super.update.call(this, url, o);

				$.extend(this, _.parseURL(url, this.defaults));
			},

			// Low-level functions for reading data. You don’t need to implement this
			// if the mv-storage/mv-source value is a URL and reading the data is just
			// a GET request to that URL.
			get: function(url) {
				// Should return a promise that resolves to the data as a string or object
				return this.db.doc(url).get();
			},

			// High level function for reading data. Calls this.get().
			// You rarely need to override this.
			load: function() {
				// Should return a promise that resolves to the data as an object
				return this.ready.then(() =>
					this.get(this.filename)
						.then(doc => Promise.resolve(doc.data() || {}))
						.catch(error => this.mavo.error(`Firebase: ${error.message}`))
				);
			},

			// Low-level saving code.
			// serialized: Data serialized according to this.format
			// path: Path to store data
			// o: Arbitrary options
			put: function(serialized, path = this.path, o = {}) {
				// Returns promise
				return this.storageBucketRef
					.child(path)
					.put(serialized)
					.then(snapshot => snapshot.ref.getDownloadURL());
			},

			// If your backend supports uploads, this is mandatory.
			// file: File object to be uploaded
			// path: relative path to store uploads (e.g. "images")
			upload: function(file, path) {
				// Upload code. Should call this.put()
				path = `${this.mavo.id}/${path}`;
				return this.put(file, path).then(downloadURL => downloadURL);
			},

			// High level function for storing data.
			// You rarely need to override this, except to avoid serialization.
			store: function(data, { path, format = this.format } = {}) {
				// Should return a promise that resolves when the data is saved successfully
				return this.db
					.doc(this.filename)
					.set(data)
					.then(() => Promise.resolve())
					.catch(error => this.mavo.error(`Firebase: ${error.message}`));
			},

			// Takes care of authentication. If passive is true, only checks if
			// the user is already logged in, but does not present any login UI.
			// Typically, you’d call this.login(true) in the constructor
			login: function(passive) {
				// Typically, you’d check if a user is already authenticated
				// and return Promise.resolve() if so.
				// Returns promise that resolves when the user has successfully authenticated
				return this.ready.then(() => {
					if (this.user) {
						return Promise.resolve(this.user);
					}

					return new Promise((resolve, reject) => {
						if (passive) {
							resolve(this.user);
						} else {
							const provider = new firebase.auth.GoogleAuthProvider();

							this.app
								.auth()
								.signInWithPopup(provider)
								.catch(error => {
									this.mavo.error(`Firebase: ${error.message}`);
									reject(error);
								});
						}
					});
				});
			},

			// Log current user out
			logout: function() {
				return this.app
					.auth()
					.signOut()
					.catch(error => {
						this.mavo.error(`Firebase: ${error.message}`);
					});
			},

			static: {
				// Mandatory and very important! This determines when your backend is used.
				// value: The mv-storage/mv-source/mv-init value
				test: function(value) {
					// Returns true if this value applies to this backend
					return /^https:\/\/.*\.firebaseio\.com(\/)?/.test(value.trim());
				},

				/**
				 * Parse the mv-storage/mv-source/mv-init value, return Firebase project id, filename
				 */
				parseURL: function(source, defaults = {}) {
					const ret = {};

					const url = new URL(source);

					ret.databaseURL = url.hostname;
					ret.projectId = url.hostname.split(".").shift();
					ret.filename = url.pathname.slice(1) || defaults.filename;

					return ret;
				}
			}
		})
	);
})(Bliss, Bliss.$);
