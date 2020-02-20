"use strict";function ownKeys(a,b){var c=Object.keys(a);if(Object.getOwnPropertySymbols){var d=Object.getOwnPropertySymbols(a);b&&(d=d.filter(function(b){return Object.getOwnPropertyDescriptor(a,b).enumerable})),c.push.apply(c,d)}return c}function _objectSpread(a){for(var b,c=1;c<arguments.length;c++)b=null==arguments[c]?{}:arguments[c],c%2?ownKeys(Object(b),!0).forEach(function(c){_defineProperty(a,c,b[c])}):Object.getOwnPropertyDescriptors?Object.defineProperties(a,Object.getOwnPropertyDescriptors(b)):ownKeys(Object(b)).forEach(function(c){Object.defineProperty(a,c,Object.getOwnPropertyDescriptor(b,c))});return a}function _defineProperty(a,b,c){return b in a?Object.defineProperty(a,b,{value:c,enumerable:!0,configurable:!0,writable:!0}):a[b]=c,a}(function(a){var b=Mavo.Backend.register(a.Class({extends:Mavo.Backend,id:"Firebase",constructor:function(c,d){var e=this,f=d.mavo,g=d.format;this.permissions.on("read"),this.defaults={filename:f.id,storageName:f.element.getAttribute("mv-firebase-storage")||f.id,features:{auth:!0,storage:!0}},a.extend(this,this.defaults),template=f.element.getAttribute("mv-firebase")||"",this.features=a.extend({},b.getFeatures(template,this.defaults.features)),this.features.auth?this.permissions.on("login"):this.permissions.on(["edit","add","delete","save"]),this.ready=a.load("https://www.gstatic.com/firebasejs/7.8.2/firebase-app.js").then(function(){return Promise.all([a.load("https://www.gstatic.com/firebasejs/7.8.2/firebase-firestore.js"),a.include(!e.features.storage,"https://www.gstatic.com/firebasejs/7.8.2/firebase-storage.js"),a.include(!e.features.auth,"https://www.gstatic.com/firebasejs/7.8.2/firebase-auth.js")]).then(function(){a.extend(e,b.parseURL(c,e.defaults));var d={apiKey:f.element.getAttribute("mv-firebase-key"),databaseURL:e.databaseURL,projectId:e.projectId,authDomain:"".concat(e.projectId,".firebaseapp.com"),storageBucket:"".concat(e.projectId,".appspot.com")};return e.app=firebase.apps.length?firebase.initializeApp(d,f.id):firebase.initializeApp(d),e.db=firebase.firestore().collection("mavo-apps"),f.element.hasAttribute("mv-firebase-realtime")?e.unsubscribe=e.db.doc(e.filename).onSnapshot(function(a){a.metadata.hasPendingWrites?"Local":"Server";f.render(a.data())},function(a){return f.error("Firebase: ".concat(a.message))}):e.unsubscribe&&e.unsubscribe(),e.features.storage&&(e.storageBucketRef=firebase.storage().ref()),e.features.auth&&firebase.auth().onAuthStateChanged(function(b){b?(e.user=_objectSpread({username:b.email,name:b.displayName,avatar:b.photoURL},b),a.fire(f.element,"mv-login",{backend:e}),e.permissions.off("login").on(["edit","add","delete","save","logout"])):(e.user=null,a.fire(f.element,"mv-logout",{backend:e}),e.permissions.off(["edit","add","delete","save","logout"]).on("login"))}),Promise.resolve()})}),this.features.auth&&this.login(!0)},update:function(c,d){this["super"].update.call(this,c,d),a.extend(this,b.parseURL(c,this.defaults))},get:function(a){return this.db.doc(a).get()},load:function(){var a=this;return this.ready.then(function(){return a.get(a.filename).then(function(a){return Promise.resolve(a.data()||{})})["catch"](function(b){return a.mavo.error("Firebase: ".concat(b.message))})})},put:function(a){var b=1<arguments.length&&arguments[1]!==void 0?arguments[1]:this.path,c=2<arguments.length&&arguments[2]!==void 0?arguments[2]:{};return this.storageBucketRef.child(b).put(a).then(function(a){return a.ref.getDownloadURL()})},upload:function(a,b){return b="".concat(this.storageName,"/").concat(b),this.put(a,b).then(function(a){return a})},store:function(a){var b=this,c=1<arguments.length&&arguments[1]!==void 0?arguments[1]:{},d=c.path,e=c.format,f=void 0===e?this.format:e;return this.db.doc(this.filename).set(a).then(function(){return Promise.resolve()})["catch"](function(a){return b.mavo.error("Firebase: ".concat(a.message))})},login:function(a){var b=this;return this.ready.then(function(){return b.user?Promise.resolve(b.user):new Promise(function(c,d){if(a)c(b.user);else{var e=new firebase.auth.GoogleAuthProvider;b.app.auth().signInWithPopup(e)["catch"](function(a){b.mavo.error("Firebase: ".concat(a.message)),d(a)})}})})},logout:function(){var a=this;return this.app.auth().signOut()["catch"](function(b){a.mavo.error("Firebase: ".concat(b.message))})},static:{test:function(a){return /^https:\/\/.*\.firebaseio\.com(\/)?/.test(a.trim())},parseURL:function(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},c={},d=new URL(a);return c.databaseURL=d.hostname,c.projectId=d.hostname.split(".").shift(),c.filename=d.pathname.slice(1)||b.filename,c},getFeatures:function(a,b){var c=b,d=Object.keys(b);if(a&&(a=a.trim())){var e=/^with\s|\b(yes|no)-\w+\b/.test(a),f=a.split(/\s+/);return f=Mavo.Functions.unique(f.reverse()).reverse(),e&&(f=d.filter(function(a){var b=Math.max,c=f.lastIndexOf(a),d=f.lastIndexOf("no-"+a),e=c>b(-1,d),g=d>b(-1,c);return e||!g})),d.forEach(function(a){return f.includes(a)?c[a]=!0:c[a]=!1}),c}return c}}}))})(Bliss);