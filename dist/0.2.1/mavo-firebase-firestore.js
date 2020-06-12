// @ts-check

/**
 * Firebase backend plugin for Mavo
 * @author Dmitry Sharabin and contributors
 * @version v0.2.1
 */
(function($) {
	"use strict";

	const _ = Mavo.Backend.register(
		$.Class({
			extends: Mavo.Backend,

			id: "Firebase",

			constructor: function(url, { mavo, format }) {
				// Initialization code
				this.permissions.on("read");

				this.defaults = {
					collection: "mavo-apps",
					filename: mavo.id,
					storageName:
						mavo.element.getAttribute("mv-firebase-storage") || mavo.id,
					features: {
						auth: false,
						storage: false,
						realtime: false
					}
				};

				$.extend(this, this.defaults);

				// Which backend features should we support?
				const template = mavo.element.getAttribute("mv-firebase") || "";

				this.features = _.getOptions(template, this.features);

				if (this.features.auth) {
					this.permissions.on("login");
				}
				else {
					this.permissions.on(["edit", "save"]);
				}

				this.ready =
					// First of all, we need to download the Firebase core file
					$.load(
						"https://www.gstatic.com/firebasejs/7.8.2/firebase-app.js"
					).then(async () => {
						// Then download the other parts if needed
						await Promise.all([
							// Cloud Firestore
							$.load(
								"https://www.gstatic.com/firebasejs/7.8.2/firebase-firestore.js"
							),

							// Cloud Storage
							$.include(
								!this.features.storage,
								"https://www.gstatic.com/firebasejs/7.8.2/firebase-storage.js"
							),

							// Authentication
							$.include(
								!this.features.auth,
								"https://www.gstatic.com/firebasejs/7.8.2/firebase-auth.js"
							)
						]);

						// Get the config info from the attribute value
						$.extend(this, _.parseSource(this.source, this.defaults));

						// The app's Firebase configuration
						const config = {
							apiKey: mavo.element.getAttribute("mv-firebase-key"),
							databaseURL: `https://${this.projectId}.firebaseio.com`,
							projectId: this.projectId,
							authDomain: `${this.projectId}.firebaseapp.com`,
							storageBucket: `${this.projectId}.appspot.com`
						};

						// Initialize Cloud Firestore through Firebase
						// Support using multiple apps on the same page
						if (!firebase.apps.length) {
							this.app = firebase.initializeApp(config);
						}
						else {
							this.app = firebase.initializeApp(config, mavo.id);
						}

						// To allow offline persistence, we MUST enable it foremost
						// Offline persistence is supported only by Chrome, Safari, and Firefox web browsers
						this.app.firestore().enablePersistence({ synchronizeTabs: true })
							.catch(error => {
								if (error.code === "unimplemented") {
									// The current browser does not support all of the
									// features required to enable persistence
									Mavo.warn(this.mavo._("firebase-offline-unimplemented"));

									this.mavo.error(`Firebase Offline: ${error.message}`);
								}
							});

						this.db = this.app.firestore().collection(this.collection);

						if (this.features.realtime) {
							// Get realtime updates
							this.unsubscribe = this.db.doc(this.filename).onSnapshot(
								doc => {
									const source = doc.metadata.hasPendingWrites
										? "Local"
										: "Server";
									// TODO: There's the problem of what to do when local edits conflict with pulled data
									if (source === "Server") {
										mavo.render(doc.data()); // Fix for issue #11
									}
								},
								error => mavo.error(`Firebase Realtime: ${error.message}`)
							);
						}
						else if (this.unsubscribe) {
							// Stop listening to changes
							this.unsubscribe();
						}

						if (this.features.storage) {
							// Get a reference to the storage service, which is used to create references in the storage bucket,
							// and create a storage reference from the storage service
							this.storageBucketRef = this.app.storage().ref();
						}

						if (this.features.auth) {
							// Set an authentication state observer and get user data
							this.app.auth().onAuthStateChanged(user => {
								if (user) {
									// User is signed in
									this.user = {
										username: user.email,
										name: user.displayName,
										avatar: user.photoURL,
										user // raw user object
									};

									$.fire(mavo.element, "mv-login", { backend: this });

									this.permissions.off("login").on(["edit", "save", "logout"]);
								}
								else {
									// User is signed out
									this.user = null;

									$.fire(mavo.element, "mv-logout", { backend: this });

									this.permissions
										.off(["edit", "add", "delete", "save", "logout"])
										.on("login");
								}
							});
						}

						return Promise.resolve();
					});

				if (this.features.auth) {
					this.login(true);
				}
			},

			update: function(url, o) {
				this.super.update.call(this, url, o);

				$.extend(this, _.parseSource(this.source, this.defaults));
			},

			get: function(url) {
				return this.db.doc(url).get();
			},

			load: function() {
				// Since we support offline persistence, we don't want end-users to think an app is hung when we are offline.
				// So we hide the progress indicator after 300ms, and it seems that loading was performed (and it really was).
				// I am not sure whether we would face this issue without making other parts of an app offline-ready,
				// but in the sake of consistency and future use I add this code here
				if (!navigator.onLine) {
					setTimeout(() => this.mavo.inProgress = false, 300);
				}

				return this.ready.then(() =>
					this.get(this.filename)
						.then(doc => Promise.resolve(doc.data() || {}))
						.catch(error => {
							Mavo.warn(this.mavo._("firebase-check-security-rules"));

							this.mavo.error(`Firebase Load Data: ${error.message}`);
						})
				);
			},

			/**
			 * Low-level saving code
			 * @param {*} serialized Data serialized according to this.format
			 * @param {*} path Path to store data
			 * @param {*} o Arbitrary options
			 */
			put: function(serialized, path = this.path, o = {}) {
				if (!this.storageBucketRef) {
					Mavo.warn(this.mavo._("firebase-enable-storage"));

					return Promise.reject(Error(`Firebase Storage: ${this.mavo._("firebase-enable-storage")}`));
				}

				return this.storageBucketRef
					.child(path)
					.put(serialized)
					.then(snapshot => snapshot.ref.getDownloadURL());
			},

			/**
			 * Upload code
			 * @param {*} file File object to be uploaded
			 * @param {*} path Relative path to store uploads (e.g. "images")
			 */
			upload: function(file, path) {
				path = `${this.storageName}/${path}`;

				return this.put(file, path)
					.then(downloadURL => downloadURL)
					.catch(error => {
							if (error.code) {
								if (this.features.auth) {
									Mavo.warn(this.mavo._("firebase-check-security-rules"));
								}
								else {
									Mavo.warn(this.mavo._("firebase-enable-auth"));
								}
							}

							this.mavo.error(`${error.message}`);
					});
			},

			store: function(data, { path, format = this.format } = {}) {
				// Since we support offline persistence, we don't want end-users to think an app is hung when we are offline.
				// So we hide the progress indicator after 300ms, and it seems that saving was performed (and it really was)
				if (!navigator.onLine) {
					setTimeout(() => this.mavo.inProgress = false, 300);
				}

				return this.db
					.doc(this.filename)
					.set(data)
					.then(() => Promise.resolve())
					.catch(error => {
						Mavo.warn(this.mavo._("firebase-enable-auth"));
						Mavo.warn(this.mavo._("firebase-check-security-rules"));

						this.mavo.error(`Firebase Auth: ${error.message}`);
					});
			},

			// Takes care of authentication. If passive is true, only checks if
			// the user is already logged in, but does not present any login UI
			login: function(passive) {
				return this.ready.then(() => {
					return new Promise((resolve, reject) => {
						if (passive) {
							resolve(this.user);
						}
						else {
							const provider = new firebase.auth.GoogleAuthProvider();

							// Apply the default browser preference
							firebase.auth().useDeviceLanguage();

							this.app
								.auth()
								.signInWithPopup(provider)
								.then(result => {
									// Log in to other similar backends that are logged out
									for (const appid in Mavo.all) {
										const storage = Mavo.all[appid].primaryBackend;

										if (storage
											&& storage.id === this.id
											&& storage !== this
											&& storage.features.auth
											&& !storage.user) {
												storage.app.auth().signInWithCredential(result.credential);
										}
									}
								})
								.catch(error => {
									this.mavo.error(`Firebase Auth: ${error.message}`);
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
						this.mavo.error(`Firebase Auth: ${error.message}`);
					});
			},

			static: {
				// Mandatory and very important! This determines when the backend is used
				// value: The mv-storage/mv-source/mv-init value
				test: function(value) {
					value = value.trim();

					return /^https:\/\/.*\.firebaseio\.com\/?/.test(value) // Backward compatibility
								|| /^firebase:\/\/.*/.test(value);
				},

				// Parse the mv-storage/mv-source/mv-init value, return project id, collection name, filename
				parseSource: function(source, defaults = {}) {
					const ret = {};

					if (/^https:\/\/.*\.firebaseio\.com\/?/.test(source)) {
						const url = new URL(source);

						ret.projectId = url.hostname.split(".").shift();
						source = url.pathname.slice(1);
					}
					else {
						source = source.replace("firebase://", "");
					}

					if (source.indexOf("/") > -1) {
						const parts = source.split("/");

						ret.projectId = ret.projectId || parts.shift();

						// If source without projectId has an odd number of parts,
						// an app author specified only collection, so we should use the default filename.
						// Otherwise, we have both: collection and filename
						ret.filename = parts.length % 2 ? defaults.filename : parts.pop();
						ret.collection = parts.join("/");
					}
					else {
						ret.projectId = ret.projectId || source;
						ret.collection = defaults.collection;
						ret.filename = defaults.filename;
					}

					return ret;
				},

				/**
				 * Parse the list of options
				 * @param {String} template The value to parse or an empty string
				 * @param {Object} defaults Default set of values
				 */
				getOptions: function(template, defaults) {
					const ret = defaults;

					const all = Object.keys(defaults);

					if (template && (template = template.trim())) {
						let ids = template.split(/\s+/);

						// Drop duplicates (last one wins)
						ids = Mavo.Functions.unique(ids.reverse()).reverse();

						all.forEach(id =>
							ids.includes(id) ? (ret[id] = true) : (ret[id] = false)
						);

						return ret;
					}

					// No template, return default set
					return ret;
				}
			}
		})
	);

	Mavo.Locale.register("en", {
		"firebase-enable-auth": "You might need to enable authorization in your app. To do so, add mv-firebase=\"auth\" to the Mavo root.",
		"firebase-enable-storage": "It seems your app does not support uploads. To enable uploads, add mv-firebase=\"storage\" to the Mavo root.",
		"firebase-check-security-rules": "Please check the security rules for your app. They might be inappropriately set. For details, see https://plugins.mavo.io/plugin/firebase-firestore#security-rules-examples.",
		"firebase-offline-unimplemented": "The current browser does not support all of the features required to enable offline persistence. This feature is supported only by Chrome, Safari, and Firefox web browsers."
	});
})(Bliss);
