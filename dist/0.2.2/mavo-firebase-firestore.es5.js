"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// @ts-check

/**
 * Firebase backend plugin for Mavo
 * @author Dmitry Sharabin and contributors
 * @version v0.2.2
 */
(function ($) {
  "use strict";

  var _ = Mavo.Backend.register($.Class({
    "extends": Mavo.Backend,
    id: "Firebase",
    constructor: function constructor(url, _ref) {
      var _this = this;

      var mavo = _ref.mavo,
          format = _ref.format;
      // Initialization code
      this.permissions.on("read");
      this.defaults = {
        collection: "mavo-apps",
        filename: mavo.id,
        storageName: mavo.element.getAttribute("mv-firebase-storage") || mavo.id,
        features: {
          auth: false,
          storage: false,
          realtime: false
        }
      };
      $.extend(this, this.defaults); // Which backend features should we support?

      var template = mavo.element.getAttribute("mv-firebase") || "";
      this.features = _.getOptions(template, this.features);

      if (this.features.auth) {
        this.permissions.on("login");
      } else {
        this.permissions.on(["edit", "save"]);
      }

      this.ready = // First of all, we need to download the Firebase core file
      $.load("https://www.gstatic.com/firebasejs/7.8.2/firebase-app.js").then(
      /*#__PURE__*/
      _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee() {
        var config;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return Promise.all([// Cloud Firestore
                $.load("https://www.gstatic.com/firebasejs/7.8.2/firebase-firestore.js"), // Cloud Storage
                $.include(!_this.features.storage, "https://www.gstatic.com/firebasejs/7.8.2/firebase-storage.js"), // Authentication
                $.include(!_this.features.auth, "https://www.gstatic.com/firebasejs/7.8.2/firebase-auth.js")]);

              case 2:
                // Get the config info from the attribute value
                $.extend(_this, _.parseSource(_this.source, _this.defaults)); // The app's Firebase configuration

                config = {
                  apiKey: mavo.element.getAttribute("mv-firebase-key"),
                  databaseURL: "https://".concat(_this.projectId, ".firebaseio.com"),
                  projectId: _this.projectId,
                  authDomain: "".concat(_this.projectId, ".firebaseapp.com"),
                  storageBucket: "".concat(_this.projectId, ".appspot.com")
                }; // Initialize Cloud Firestore through Firebase
                // We want all mavo apps with the same projectId share the same instance of Firebase app
                // If there is no previously created Firebase app with the specified projectId, create one

                if (!firebase.apps.length) {
                  _this.app = firebase.initializeApp(config);
                } else {
                  _this.app = firebase.apps.find(function (app) {
                    return app.options.projectId === _this.projectId;
                  }) || firebase.initializeApp(config, _this.projectId);
                } // To allow offline persistence, we MUST enable it foremost
                // Offline persistence is supported only by Chrome, Safari, and Firefox web browsers


                if (!_this.app.firestore()._persistenceKey) {
                  // Enable offline persistence only once per Firebase app
                  _this.app.firestore().enablePersistence({
                    synchronizeTabs: true
                  })["catch"](function (error) {
                    if (error.code === "unimplemented") {
                      // The current browser does not support all of the
                      // features required to enable persistence
                      Mavo.warn(_this.mavo._("firebase-offline-unimplemented"));

                      _this.mavo.error("Firebase Offline: ".concat(error.message));
                    }
                  });
                }

                _this.db = _this.app.firestore().collection(_this.collection);

                if (_this.features.realtime) {
                  // Get realtime updates
                  _this.unsubscribe = _this.db.doc(_this.filename).onSnapshot(function (doc) {
                    return _.updatesHandler(doc, mavo);
                  }, function (error) {
                    return mavo.error("Firebase Realtime: ".concat(error.message));
                  });
                } else if (_this.unsubscribe) {
                  // Stop listening to changes
                  _this.unsubscribe();
                }

                if (_this.features.storage) {
                  // Get a reference to the storage service, which is used to create references in the storage bucket,
                  // and create a storage reference from the storage service
                  _this.storageBucketRef = _this.app.storage().ref();
                }

                if (_this.features.auth) {
                  // Set an authentication state observer and get user data
                  _this.app.auth().onAuthStateChanged(function (user) {
                    if (user) {
                      // User is signed in
                      _this.user = {
                        username: user.email,
                        name: user.displayName,
                        avatar: user.photoURL,
                        user: user // raw user object

                      };
                      $.fire(mavo.element, "mv-login", {
                        backend: _this
                      });

                      _this.permissions.off("login").on(["edit", "save", "logout"]);
                    } else {
                      // User is signed out
                      _this.user = null;
                      $.fire(mavo.element, "mv-logout", {
                        backend: _this
                      });

                      _this.permissions.off(["edit", "add", "delete", "save", "logout"]).on("login");
                    }
                  });
                }

                return _context.abrupt("return", Promise.resolve());

              case 11:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      })));

      if (this.features.auth) {
        this.login(true);
      }
    },
    update: function update(url, o) {
      this["super"].update.call(this, url, o);
      $.extend(this, _.parseSource(this.source, this.defaults));

      if (this.app) {
        this.db = this.app.firestore().collection(this.collection);

        if (this.unsubscribe) {
          // Stop listening to changes
          this.unsubscribe(); // Get realtime updates for a new document

          this.unsubscribe = this.db.doc(this.filename).onSnapshot(function (doc) {
            return _.updatesHandler(doc, o.mavo);
          }, function (error) {
            return o.mavo.error("Firebase Realtime: ".concat(error.message));
          });
        }
      }
    },
    get: function get(url) {
      return this.db.doc(url).get();
    },
    load: function load() {
      var _this2 = this;

      // Since we support offline persistence, we don't want end-users to think an app is hung when we are offline.
      // So we hide the progress indicator after 300ms, and it seems that loading was performed (and it really was).
      // I am not sure whether we would face this issue without making other parts of an app offline-ready,
      // but in the sake of consistency and future use I add this code here
      if (!navigator.onLine) {
        setTimeout(function () {
          return _this2.mavo.inProgress = false;
        }, 300);
      }

      return this.ready.then(function () {
        return _this2.get(_this2.filename).then(function (doc) {
          return Promise.resolve(doc.data() || {});
        })["catch"](function (error) {
          Mavo.warn(_this2.mavo._("firebase-check-security-rules"));

          _this2.mavo.error("Firebase Load Data: ".concat(error.message));
        });
      });
    },

    /**
     * Low-level saving code
     * @param {*} serialized Data serialized according to this.format
     * @param {*} path Path to store data
     * @param {*} o Arbitrary options
     */
    put: function put(serialized) {
      var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.path;
      var o = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (!this.storageBucketRef) {
        Mavo.warn(this.mavo._("firebase-enable-storage"));
        return Promise.reject(Error("Firebase Storage: ".concat(this.mavo._("firebase-enable-storage"))));
      }

      return this.storageBucketRef.child(path).put(serialized).then(function (snapshot) {
        return snapshot.ref.getDownloadURL();
      });
    },

    /**
     * Upload code
     * @param {*} file File object to be uploaded
     * @param {*} path Relative path to store uploads (e.g. "images")
     */
    upload: function upload(file, path) {
      var _this3 = this;

      path = "".concat(this.storageName, "/").concat(path);
      return this.put(file, path).then(function (downloadURL) {
        return downloadURL;
      })["catch"](function (error) {
        if (error.code) {
          if (_this3.features.auth) {
            Mavo.warn(_this3.mavo._("firebase-check-security-rules"));
          } else {
            Mavo.warn(_this3.mavo._("firebase-enable-auth"));
          }
        }

        _this3.mavo.error("".concat(error.message));
      });
    },
    store: function store(data) {
      var _this4 = this;

      var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          path = _ref3.path,
          _ref3$format = _ref3.format,
          format = _ref3$format === void 0 ? this.format : _ref3$format;

      // Since we support offline persistence, we don't want end-users to think an app is hung when we are offline.
      // So we hide the progress indicator after 300ms, and it seems that saving was performed (and it really was)
      if (!navigator.onLine) {
        setTimeout(function () {
          return _this4.mavo.inProgress = false;
        }, 300);
      }

      return this.db.doc(this.filename).set(data).then(function () {
        return Promise.resolve();
      })["catch"](function (error) {
        Mavo.warn(_this4.mavo._("firebase-enable-auth"));
        Mavo.warn(_this4.mavo._("firebase-check-security-rules"));

        _this4.mavo.error("Firebase Auth: ".concat(error.message));
      });
    },
    // Takes care of authentication. If passive is true, only checks if
    // the user is already logged in, but does not present any login UI
    login: function login(passive) {
      var _this5 = this;

      return this.ready.then(function () {
        return new Promise(function (resolve, reject) {
          if (passive) {
            resolve(_this5.user);
          } else {
            var provider = new firebase.auth.GoogleAuthProvider(); // Apply the default browser preference

            firebase.auth().useDeviceLanguage();

            _this5.app.auth().signInWithPopup(provider)["catch"](function (error) {
              _this5.mavo.error("Firebase Auth: ".concat(error.message));

              reject(error);
            });
          }
        });
      });
    },
    // Log current user out
    logout: function logout() {
      var _this6 = this;

      return this.app.auth().signOut()["catch"](function (error) {
        _this6.mavo.error("Firebase Auth: ".concat(error.message));
      });
    },
    "static": {
      // Mandatory and very important! This determines when the backend is used
      // value: The mv-storage/mv-source/mv-init value
      test: function test(value) {
        value = value.trim();
        return /^https:\/\/.*\.firebaseio\.com\/?/.test(value) // Backward compatibility
        || /^firebase:\/\/.*/.test(value);
      },
      // Parse the mv-storage/mv-source/mv-init value, return project id, collection name, filename
      parseSource: function parseSource(source) {
        var defaults = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var ret = {};

        if (/^https:\/\/.*\.firebaseio\.com\/?/.test(source)) {
          var url = new URL(source);
          ret.projectId = url.hostname.split(".").shift();
          source = url.pathname.slice(1);
        } else {
          source = source.replace("firebase://", "");
        }

        if (source.indexOf("/") > -1) {
          var parts = source.split("/");
          ret.projectId = ret.projectId || parts.shift(); // If source without projectId has an odd number of parts,
          // an app author specified only collection, so we should use the default filename.
          // Otherwise, we have both: collection and filename

          ret.filename = parts.length % 2 ? defaults.filename : parts.pop();
          ret.collection = parts.join("/");
        } else {
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
      getOptions: function getOptions(template, defaults) {
        var ret = defaults;
        var all = Object.keys(defaults);

        if (template && (template = template.trim())) {
          var ids = template.split(/\s+/); // Drop duplicates (last one wins)

          ids = Mavo.Functions.unique(ids.reverse()).reverse();
          all.forEach(function (id) {
            return ids.includes(id) ? ret[id] = true : ret[id] = false;
          });
          return ret;
        } // No template, return default set


        return ret;
      },

      /**
       * A handler for realtime updates of a document
       * @param {Object} snapshot A document snapshot
       * @param {Object} mavo Mavo instance
       */
      updatesHandler: function updatesHandler(snapshot, mavo) {
        var source = snapshot.metadata.hasPendingWrites ? "Local" : "Server"; // TODO: There's the problem of what to do when local edits conflict with pulled data

        if (source === "Server") {
          mavo.render(snapshot.data()); // Fix for issue #11
        }
      }
    }
  }));

  Mavo.Locale.register("en", {
    "firebase-enable-auth": "You might need to enable authorization in your app. To do so, add mv-firebase=\"auth\" to the Mavo root.",
    "firebase-enable-storage": "It seems your app does not support uploads. To enable uploads, add mv-firebase=\"storage\" to the Mavo root.",
    "firebase-check-security-rules": "Please check the security rules for your app. They might be inappropriately set. For details, see https://plugins.mavo.io/plugin/firebase-firestore#security-rules-examples.",
    "firebase-offline-unimplemented": "The current browser does not support all of the features required to enable offline persistence. This feature is supported only by Chrome, Safari, and Firefox web browsers."
  });
})(Bliss);