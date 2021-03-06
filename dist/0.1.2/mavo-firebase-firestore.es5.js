"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// @ts-check

/**
 * Firebase backend plugin for Mavo
 * @author Dmitry Sharabin and contributors
 * @version v0.1.2
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
        collectionName: "mavo-apps",
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
      this.features = _.getFeatures(template, this.features);

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
                // Get all the config info from the raw URL (attribute value) and the corresponding attribute
                $.extend(_this, _.parseURL(_this.source, _this.defaults)); // The app's Firebase configuration

                config = {
                  apiKey: mavo.element.getAttribute("mv-firebase-key"),
                  databaseURL: _this.databaseURL,
                  projectId: _this.projectId,
                  authDomain: "".concat(_this.projectId, ".firebaseapp.com"),
                  storageBucket: "".concat(_this.projectId, ".appspot.com")
                }; // Initialize Cloud Firestore through Firebase
                // Support using multiple apps on the same page

                if (!firebase.apps.length) {
                  _this.app = firebase.initializeApp(config);
                } else {
                  _this.app = firebase.initializeApp(config, mavo.id);
                }

                _this.db = _this.app.firestore().collection(_this.collectionName);

                if (_this.features.realtime) {
                  // Get realtime updates
                  _this.unsubscribe = _this.db.doc(_this.filename).onSnapshot(function (doc) {
                    var source = doc.metadata.hasPendingWrites ? "Local" : "Server"; // TODO: There's the problem of what to do when local edits conflict with pulled data
                    // if (source === "Server" && ...) {...}

                    mavo.render(doc.data());
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

              case 10:
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
      $.extend(this, _.parseURL(this.source, this.defaults));
    },
    get: function get(url) {
      return this.db.doc(url).get();
    },
    load: function load() {
      var _this2 = this;

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

            _this5.app.auth().signInWithPopup(provider).then(function (result) {
              // Log in to other similar backends that are logged out
              for (var appid in Mavo.all) {
                var storage = Mavo.all[appid].primaryBackend;

                if (storage && storage.id === _this5.id && storage !== _this5 && storage.features.auth && !storage.user) {
                  storage.app.auth().signInWithCredential(result.credential);
                }
              }
            })["catch"](function (error) {
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
        // Returns true if this value applies to this backend
        return /^https:\/\/.*\.firebaseio\.com\/?/.test(value.trim());
      },
      // Parse the mv-storage/mv-source/mv-init value, return Firebase database URL, project id, collection name, filename
      parseURL: function parseURL(source) {
        var defaults = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var ret = {};
        var url = new URL(source);
        ret.databaseURL = url.hostname;
        ret.projectId = url.hostname.split(".").shift();
        var path = url.pathname.slice(1);

        if (path.indexOf("/") > -1) {
          var parts = path.split("/");

          var _parts = _slicedToArray(parts, 2);

          ret.collectionName = _parts[0];
          ret.filename = _parts[1];
        } else {
          ret.collectionName = defaults.collectionName;
          ret.filename = path || defaults.filename;
        }

        return ret;
      },

      /**
       * Parse the list of features the Firebase backend should support
       * @param {*} template The value of the mv-firebase attribute or an empty string
       */
      getFeatures: function getFeatures(template, defaults) {
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
      }
    }
  }));

  Mavo.Locale.register("en", {
    "firebase-enable-auth": "You might need to enable authorization in your app. To do so, add mv-firebase=\"auth\" to the Mavo root.",
    "firebase-enable-storage": "It seems your app does not support uploads. To enable uploads, add mv-firebase=\"storage\" to the Mavo root.",
    "firebase-check-security-rules": "Please check the security rules for your app. They might be inappropriately set. For details, see https://plugins.mavo.io/plugin/firebase-firestore#security-rules-examples."
  });
})(Bliss);