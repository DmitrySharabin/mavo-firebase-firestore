// @ts-check

/**
 * Firebase backend plugin for Mavo
 * @author Dmitry Sharabin and contributors
 * @version v0.3.9
 */
(function ($) {
	"use strict";

	const PROVIDERS = {
		"google": {},
		"facebook": {},
		"twitter": {},
		"github": {}
	};

	// Deprecated attributes:
	// deprecated -> new attribute, url for help
	const DEPRECATED = {
		"mv-firebase-key": {
			attribute: "mv-storage-key",
			url: "https://plugins.mavo.io/plugin/firebase-firestore#setup-mavo-application"
		},
		"mv-firebase-auth": {
			attribute: "mv-storage-providers",
			url: "https://plugins.mavo.io/plugin/firebase-firestore#authentication-with-firebase-using-google-facebook-twitter-or-github-accounts"
		},
		"mv-firebase": {
			attribute: "mv-storage-options",
			url: "https://plugins.mavo.io/plugin/firebase-firestore#customization"
		},
		"mv-firebase-storage": {
			attribute: "mv-storage-bucketname",
			url: "https://plugins.mavo.io/plugin/firebase-firestore#customization"
		},
	};

	Mavo.Plugins.register("firebase-firestore", {
		dependencies: [
			"https://cdn.jsdelivr.net/gh/DmitrySharabin/mavo-firebase-firestore/mavo-firebase-firestore.css"
		],

		hooks: {
			"init-start": function (mavo) {
				// Add buttons for auth providers to the Mavo bar
				// Show them only if the Firebase backend is used and any auth provider is specified
				Object.keys(PROVIDERS).forEach(p => {
					const id = `firebase-auth-${p}`;

					Mavo.UI.Bar.controls[id] = {
						create (custom) {
							return custom || $.create("button", {
								type: "button",
								className: `mv-${id}`,
								textContent: mavo._(id),
							});
						},

						action () {
							mavo.primaryBackend.provider = p;
							mavo.primaryBackend.login(false);
						},

						permission: "login",

						condition () {
							return Boolean(mavo.primaryBackend.project) && mavo.primaryBackend.authProviders?.includes?.(p);
						}
					};
				});

				// Hide the Login button if either of auth providers is specified
				$.extend(Mavo.UI.Bar.controls.login, {
					condition () {
						return Boolean(mavo.primaryBackend.project)? !mavo.primaryBackend.authProviders?.length : mavo.primaryBackend.permissions.login;
					}
				});
			}
		}
	});

	const _ = Mavo.Backend.register(
		$.Class({
			extends: Mavo.Backend,

			id: "Firebase",

			constructor (url, o) {
				// Initialization code
				this.permissions.on("read");

				this.defaults = {
					collection: "mavo-apps",
					filename: o.mavo.id,
					bucketName: o.bucketname || o.mavo.element.getAttribute("mv-firebase-storage") || o.mavo.id,
					features: {
						auth: false,
						storage: false,
						realtime: false,
						"offline-persistence": false,
						"all-can-write": false,
						"all-can-edit": false
					},
					authProviders: _.getAuthProviders(o.providers || o.mavo.element.getAttribute("mv-firebase-auth") || "", PROVIDERS),
					provider: undefined
				};

				$.extend(this, this.defaults);

				// Warn an author about deprecated attributes
				for (const attribute in DEPRECATED) {
					if (o.mavo.element.hasAttribute(attribute)) {
						const newAttribute = DEPRECATED[attribute].attribute;
						const url = DEPRECATED[attribute].url;

						Mavo.warn(`@${attribute} is deprecated. Please use @${newAttribute} instead. For details, see ${url}.`);
					}
				}

				// Which backend features should we support?
				const template = o.options || o.mavo.element.getAttribute("mv-firebase") || "";
				this.features = _.getOptions(template, this.defaults.features);

				// If either of the auth providers is specified, we must enable the auth feature
				if (this.authProviders.length) {
					this.features.auth = true;
				}

				if (this.features.auth) {
					this.permissions.on("login");

					// If none of the auth providers is specified, by default Google is used
					if (!this.authProviders.length) {
						this.provider = "google";
					}
				}
				else {
					this.permissions.on(["edit", "save"]);
				}

				this.ready =
					// First of all, we need to download the Firebase core file
					$.load(
						"https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js"
					).then(async () => {
						// Then download the other parts if needed
						await Promise.all([
							// Cloud Firestore
							$.load(
								"https://www.gstatic.com/firebasejs/8.2.0/firebase-firestore.js"
							),

							// Cloud Storage
							$.include(
								!this.features.storage,
								"https://www.gstatic.com/firebasejs/8.2.0/firebase-storage.js"
							),

							// Authentication
							$.include(
								!this.features.auth,
								"https://www.gstatic.com/firebasejs/8.2.0/firebase-auth.js"
							)
						]);

						// Get the config info from the attribute value
						$.extend(this, _.parseSource(this.source, this.defaults));

						// If an author provided backend metadata, use them
						// since they have higher priority
						this.project = o.project ?? this.project;
						this.collection = o.collection ?? this.collection;
						this.filename = o.filename ?? this.filename;

						// The app's Firebase configuration
						const config = {
							apiKey: this.key ?? o.mavo.element.getAttribute("mv-firebase-key"),
							databaseURL: `https://${this.project}.firebaseio.com`,
							projectId: this.project,
							authDomain: `${this.project}.firebaseapp.com`,
							storageBucket: `${this.project}.appspot.com`
						};

						// Initialize Cloud Firestore through Firebase
						// We want all mavo apps with the same project ID share the same instance of Firebase app
						// If there is no previously created Firebase app with the specified project ID, create one
						if (!firebase.apps.length) {
							this.app = firebase.initializeApp(config);
						}
						else {
							this.app = firebase.apps.find(app => app.options.projectId === this.project)
								|| firebase.initializeApp(config, this.project);
						}

						if (this.features["offline-persistence"]) {
							// To allow offline persistence, we MUST enable it foremost and only once
							// Offline persistence is supported only by Chrome, Safari, and Firefox web browsers
							try {
								this.app.firestore().enablePersistence({ synchronizeTabs: true });
							}
							catch (error) {
								if (error.code === "unimplemented") {
									// The current browser does not support all of the
									// features required to enable persistence
									Mavo.warn(this.mavo._("firebase-offline-persistence-unimplemented"));

									this.mavo.error(`Firebase Offline Persistence: ${error.message}`);
								}
							}
						}

						this.db = this.app.firestore().collection(this.collection);

						if (this.features.realtime) {
							// Get realtime updates
							this.unsubscribe = this.db.doc(this.filename).onSnapshot(
								doc => _.updatesHandler(doc, o.mavo),
								error => o.mavo.error(`Firebase Realtime: ${error.message}`)
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
							const defaultPermissions = ["login"];

							// By default, if the authentication feature is on, only signed-in users can edit and save the app's data.
							// We want to let authors granularly override the default behavior,
							// and we could enable the corresponding permissions
							if (this.features["all-can-write"]) {
								defaultPermissions.push("save");
							}

							if (this.features["all-can-edit"]) {
								defaultPermissions.push("edit");
							}

							// Set an authentication state observer and get user data
							this.app.auth().onAuthStateChanged(user => {
								if (user) {
									// User is signed in
									this.user = {
										username: user.email,
										name: user.displayName,
										avatar: user.photoURL,
										info: user // raw user object
									};

									$.fire(o.mavo.element, "mv-login", { backend: this });

									this.permissions.off("login").on(["edit", "save", "logout"]);
								}
								else {
									// User is signed out
									this.user = null;

									$.fire(o.mavo.element, "mv-logout", { backend: this });

									this.permissions
										.off(["edit", "add", "delete", "save", "logout"])
										.on(defaultPermissions);
								}
							});
						}

						return Promise.resolve();
					});
			},

			update (url, o) {
				this.super.update.call(this, url, o);

				$.extend(this, _.parseSource(this.source, this.defaults));

				// If an author provided backend metadata, use them
				// since they have higher priority
				this.project = o.project ?? this.project;
				this.collection = o.collection ?? this.collection;
				this.filename = o.filename ?? this.filename;

				if (this.app) {
					this.db = this.app.firestore().collection(this.collection);

					if (this.unsubscribe) {
						// Stop listening to changes
						this.unsubscribe();

						// Get realtime updates for a new document
						this.unsubscribe = this.db.doc(this.filename).onSnapshot(
							doc => _.updatesHandler(doc, o.mavo),
							error => o.mavo.error(`Firebase Realtime: ${error.message}`)
						);
					}
				}
			},

			async load () {
				// Since we support offline persistence, we don't want end-users to think an app is hung when we are offline.
				// So we hide the progress indicator after 300ms, and it seems that loading was performed (and it really was).
				// I am not sure whether we would face this issue without making other parts of an app offline-ready,
				// but in the sake of consistency and future use I add this code here
				if (this.features["offline-persistence"] && !navigator.onLine) {
					setTimeout(() => this.mavo.inProgress = false, 300);
				}

				await this.ready;

				try {
					const doc = await this.db.doc(this.filename).get();

					return doc.data() || {};
				}
				catch (error) {
					Mavo.warn(this.mavo._("firebase-check-security-rules"));
					this.mavo.error(`Firebase Load Data: ${error.message}`);

					return null;
				}
			},

			/**
			 * Low-level saving code
			 * @param {*} serialized Data serialized according to this.format
			 * @param {*} path Path to store data
			 * @param {*} o Arbitrary options
			 */
			put (serialized, path = this.path, o = {}) {
				// Since we support offline persistence, we don't want end-users to think an app is hung when we are offline.
				// So we hide the progress indicator after 300ms, and it seems that saving was performed (and it really was)
				if (this.features["offline-persistence"] && !navigator.onLine) {
					setTimeout(() => this.mavo.inProgress = false, 300);
				}

				if (o.isFile) {
					if (!this.storageBucketRef) {
						Mavo.warn(this.mavo._("firebase-enable-storage"));

						return Promise.reject(Error(`Firebase Storage: ${this.mavo._("firebase-enable-storage")}`));
					}

					return this.storageBucketRef
						.child(path)
						.put(serialized)
						.then(snapshot => snapshot.ref.getDownloadURL());
				}

				return this.db
					.doc(this.filename)
					.set(JSON.parse(serialized))
					.then(() => Promise.resolve())
					.catch(error => {
						if (this.features.auth) {
							Mavo.warn(this.mavo._("firebase-check-security-rules"));
						}
						else {
							Mavo.warn(this.mavo._("firebase-enable-auth"));
							Mavo.warn(this.mavo._("firebase-check-security-rules"));
						}

						this.mavo.error(`Firebase Auth: ${error.message}`);
					});
			},

			/**
			 * Upload code
			 * @param {*} file File object to be uploaded
			 * @param {*} path Relative path to store uploads (e.g. "images")
			 */
			async upload (file, path) {
				path = `${this.bucketName}/${path}`;

				try {
					const url = await this.put(file, path, {isFile: true});

					return url;
				}
				catch (error) {
					if (error.code) {
						if (this.features.auth) {
							Mavo.warn(this.mavo._("firebase-check-security-rules"));
						}
						else {
							Mavo.warn(this.mavo._("firebase-enable-auth"));
							Mavo.warn(this.mavo._("firebase-check-security-rules"));
						}
					}

					this.mavo.error(`${error.message}`);

					return null;
				}
			},

			// Takes care of authentication. If passive is true, only checks if
			// the user is already logged in, but does not present any login UI
			async login (passive) {
				await this.ready;

				return new Promise((resolve, reject) => {
					if (passive) {
						resolve(this.user);
					}
					else {
						// Apply the default browser preference
						firebase.auth().useDeviceLanguage();

						this.app
							.auth()
							.signInWithPopup(_.buildProvider(this.provider))
							.catch(error => {
								this.mavo.error(`Firebase Auth: ${error.message}`);
								reject(error);
							});
					}
				});
			},

			// Log current user out
			logout () {
				return this.app
					.auth()
					.signOut()
					.catch(error => {
						this.mavo.error(`Firebase Auth: ${error.message}`);
					});
			},

			static: {
				// Mandatory and very important! This determines when the backend is used
				// value: The mv-storage/mv-source/mv-init/mv-uploads value
				test (value) {
					return /^https:\/\/.*\.firebaseio\.com\/?/.test(value) // Backward compatibility
						|| /^firebase:\/\/.*/.test(value);
				},

				// Parse the mv-storage/mv-source/mv-init/mv-uploads value, return project ID, collection name, filename
				parseSource (source, defaults = {}) {
					const ret = {};

					if (/^https:\/\/.*\.firebaseio\.com\/?/.test(source)) {
						const url = new URL(source);

						ret.project = url.hostname.split(".").shift();
						source = url.pathname.slice(1);
					}
					else {
						source = source.replace("firebase://", "");
					}

					if (source.indexOf("/") > -1) {
						const parts = source.split("/");

						ret.project = ret.project || parts.shift();

						// If source without project ID has an odd number of parts,
						// an app author specified only collection, so we should use the default filename.
						// Otherwise, we have both: collection and filename
						ret.filename = parts.length % 2 ? defaults.filename : parts.pop();
						ret.collection = parts.join("/");
					}
					else {
						ret.project = ret.project || source;
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
				getOptions (template, defaults) {
					const ret = defaults;

					const all = Object.keys(defaults);

					if (template = template?.trim()) {
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
				},

				/**
				 * A handler for realtime updates of a document
				 * @param {Object} snapshot A document snapshot
				 * @param {Object} mavo Mavo instance
				 */
				updatesHandler (snapshot, mavo) {
					const source = snapshot.metadata.hasPendingWrites
						? "Local"
						: "Server";
					// TODO: There's the problem of what to do when local edits conflict with pulled data
					if (source === "Server") {
						// When an app author enables the autosave feature,
						// we don't want data loss from race condition with autosave and realtime updates.
						// We must save the state of the autosave feature for not to enable it by mistake
						const autoSaveState = mavo.autoSave;

						mavo.autoSave = false;
						mavo.render(snapshot.data());
						mavo.autoSave = autoSaveState;
					}
				},

				/**
				 * Parse the list of auth providers
				 * @param {String} template The value to parse or an empty string
				 * @param {Object} defaults Default set of auth providers
				 */
				getAuthProviders (template, defaults) {
					const all = Object.keys(defaults);

					if (template = template?.trim()) {
						let ids = template.split(/\s+/);

						// Convert all auth providers names to lowercase and drop duplicates
						ids = Mavo.Functions.unique(ids.map(id => id.toLowerCase()));

						// Drop not supported auth providers
						ids = ids.filter(id => all.includes(id));

						return ids;
					}

					// No auth providers provided
					return [];
				},

				/**
				 * Build an instance of the specified provider object. Fallback to Google
				 * @param {String} provider An auth provider name
				 */
				buildProvider (provider = "google") {
					// Make provider name title-cased
					provider = provider.charAt(0).toUpperCase() + provider.slice(1);

					return eval(`new firebase.auth.${provider}AuthProvider()`);
				}
			}
		})
	);

	Mavo.Locale.register("en", {
		"firebase-enable-auth": "You might need to enable authorization in your app. To do so, add mv-storage-options=\"auth\" to the Mavo root. Note: Instead of mv-storage, you can also use other backend types: mv-source, mv-init, and mv-uploads.",
		"firebase-enable-storage": "It seems your app does not support uploads. To enable uploads, add mv-storage-options=\"storage\" to the Mavo root. Note: Instead of mv-storage, you can also use other backend types: mv-source, mv-init, and mv-uploads.",
		"firebase-check-security-rules": "Please check the security rules for your app. They might be inappropriately set. For details, see https://plugins.mavo.io/plugin/firebase-firestore#security-rules-examples.",
		"firebase-offline-persistence-unimplemented": "The current browser does not support all of the features required to enable offline persistence. This feature is supported only by Chrome, Safari, and Firefox web browsers.",
		"firebase-auth-google": "Google",
		"firebase-auth-facebook": "Facebook",
		"firebase-auth-twitter": "Twitter",
		"firebase-auth-github": "GitHub"
	});
})(Bliss);
