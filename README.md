# WIP. Firebase backend plugin for Mavo

To use **Firebase** backend, follow the setup instructions below.

## Table of Contents

  - [Setup Firebase](#setup-firebase)
    - [**Step 1**: Sign into Firebase using your Google account](#step-1-sign-into-firebase-using-your-google-account)
    - [**Step 2**: Create a Firebase project](#step-2-create-a-firebase-project)
    - [**Step 3**: Register your app with Firebase](#step-3-register-your-app-with-firebase)
    - [**Step 4**: Activate Cloud Firestore](#step-4-activate-cloud-firestore)
    - [**Step 5**: Set up Cloud Firestore security rules](#step-5-set-up-cloud-firestore-security-rules)
    - [**Step 6**: Enable Google Sign-In in the Firebase console](#step-6-enable-google-sign-in-in-the-firebase-console)
    - [**Step 7**: Whitelist your domain](#step-7-whitelist-your-domain)
    - [**Step 8**: Create a default Storage bucket](#step-8-create-a-default-storage-bucket)
    - [**Step 9**: Set up security rules for the default Storage bucket](#step-9-set-up-security-rules-for-the-default-storage-bucket)
  - [Setup Mavo application](#setup-mavo-application)
    - [Customization](#customization)
    - [Demo](#demo)
  - [Security rules examples](#security-rules-examples)
    - [General rules](#general-rules)
      - [Cloud Firestore](#cloud-firestore)
      - [Storage bucket](#storage-bucket)
    - [App-specific rules](#app-specific-rules)
      - [Cloud Firestore](#cloud-firestore-1)
      - [Storage bucket](#storage-bucket-1)

## Setup Firebase

### Step 1: [Sign into Firebase](https://console.firebase.google.com/) using your Google account

### Step 2: Create a Firebase project

1.  In the [Firebase console](https://console.firebase.google.com/), click **Add project**, then enter a **Project name**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_2_1_1.png)

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_2_1_2.png)

2.  (_Optional_) If you are creating a new project, you can edit the **Project ID**.

    Firebase automatically assigns a unique ID to your Firebase project. To use a specific identifier, you must edit your project ID during this setup step. You cannot change your project ID later.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_2_2_1.png)

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_2_2_2.png)

3.  Click **Continue**.
4.  (_Optional_) Set up Google Analytics for your project, then click **Continue**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_2_4.png)

5.  Click **Create project**.

    Firebase automatically provisions resources for your Firebase project. When the process completes, you'll be taken to the overview page for your Firebase project in the Firebase console.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_2_5.png)

6. Click **Continue**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_2_6.png)

### Step 3: Register your app with Firebase

1. In the center of the [Firebase console](https://console.firebase.google.com/)'s project overview page, click the **Web** icon (**</>**) to launch the setup workflow.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_3_1_1.png)

If you've already added an app to your Firebase project, click **Add app** to display the platform options.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_3_1_2.png)

2. Enter your app's nickname.

   This nickname is an internal, convenience identifier and is only visible to you in the Firebase console.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_3_2.png)

3. (_Optional_) Set up Firebase Hosting for your web app.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_3_3.png)

4. Click **Register app**.
5. Save for later usage the two values: **databaseURL** and **apiKey**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_3_5.png)

6. Click **Continue to console**.

### Step 4: Activate Cloud Firestore

1. In the [Firebase console](https://console.firebase.google.com/), open the **Database** section.

2. Click **Create database**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_4a_2.png)

3. Review the messaging about securing your data using security rules. Choose the mode you want to start in.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_4a_3.png)

4. Click **Next**.

5. Select a location for your Cloud Firestore data.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_4a_5.png)

**Note**: If you aren't able to select a location, then your project already has a default resource location. It was set either during project creation or when setting up another service that requires a location setting.

**Warning**: After you set your project's default resource location, you cannot change it.

6. Click **Done**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_4_1.png)

### Step 5: Set up Cloud Firestore security rules

1. In the [Firebase console](https://console.firebase.google.com/), open the **Database** section.
2. Open the **Rules** tab.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_5_2.png)

3. [Write your rules](#cloud-firestore) in the online editor, then click **Publish**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_5_3.png)

### Step 6: Enable Google Sign-In in the Firebase console

1. In the [Firebase console](https://console.firebase.google.com/), open the **Authentication** section.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_6_1.png)

2. On the **Sign-in method** tab, in the **Sign-in providers** section, enable the **Google** sign-in method.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_6_2_1.png)

You must specify **Project support email** by selecting it from the list. You can also edit the provided **Project public-facing name**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_6_2_2.png)

3. Click **Save**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_6_3.png)

### Step 7: Whitelist your domain

To use Firebase Authentication in a web app, you must whitelist the domains that the Firebase Authentication servers can redirect to after signing in a user.

By default, **localhost** and your Firebase project's hosting domain are whitelisted. You must whitelist the full domain names of any other of your Mavo app's hosts. **Note**: whitelisting a domain allows for requests from any URL and port of that domain.

1. In the [Firebase console](https://console.firebase.google.com/), open the **Authentication** section.
2. On the **Sign-in method** tab, in the **Authorized domains** section, click **Add domain**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_7_2.png)

3. Type in the name of your domain and click **Add**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_7_3_1.png)

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_7_3_2.png)

### Step 8: Create a default Storage bucket

Cloud Storage for Firebase lets you upload and share user generated content, such as images and video, which allows you to build rich media content into your apps.

1. From the navigation pane of the [Firebase console](https://console.firebase.google.com/), select **Storage**, then click **Get started**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_8_1.png)

2. Review the messaging about securing your Storage data using security rules. During development, consider setting up your rules for public access.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_8_2.png)

3. Click **Next**.
4. Select a location for your default Storage bucket.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_8_4.png)

**Note**: If you aren't able to select a location, then your project already has a default resource location. It was set either during project creation or when setting up another service that requires a location setting.

**Warning**: After you set your project's default resource location, you cannot change it.

5. Click **Done**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_8_5.png)

### Step 9: Set up security rules for the default Storage bucket

1. In the [Firebase console](https://console.firebase.google.com/), open the **Storage** section.
2. Open the **Rules** tab.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_9_2.png)

3. [Write your rules](#storage-bucket) in the online editor, then click **Publish**.

![](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/step_9_3.png)

## Setup Mavo application

Set the following attributes on the Mavo root element (the one with the `mv-app` attribute):

| Attribute         | Value                                                                      | Example                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `mv-storage`      | `databaseURL`<br />(see [Step 3](#step-3-register-your-app-with-firebase)) | `mv-storage="https://mavo-demos.firebaseio.com"`. <br />**Note**: You can also use this value in other attributes: `mv-source` and `mv-init`. |
| `mv-firebase-key` | `apiKey`<br /> (see [Step 3](#step-3-register-your-app-with-firebase))     | `mv-firebase-key="AIzaSyDvZ3EBuhlvFm529vMPeU7dbqvdkjv9WQU"`                                                                                   |

**Note**: The **Firebase** backend lets you have multiple Mavo applications in one Firebase project if they have **different names**. That means you can use the `databaseURL` and `apiKey` values multiple times.

### Customization

By default, the **Firebase** backend doesn't enable authentication (`auth`) and storing an end-user's files (`storage`) and doesn't load the corresponding JavaScript files implementing these features. You can enable either of these features or both by adding the `mv-firebase` attribute to the Mavo root. For example: `mv-firebase="auth"` enables authentication, `mv-firebase="storage"` let end-users upload their files, and `mv-firebase="auth storage"` enables both these features (see [example](#demo) below).

**Note**: Keep in mind that if the authentication feature is on, **only signed-in users can edit app's data**, regardless of the security rules set for your app in the [Firebase console](https://console.firebase.google.com/). That might change soon. Stay in touch! 😊

By default, the **Firebase** backend stores data in the `mavo-apps` collection in a file whose name matches the name of a Mavo app. You can change it by specifying the name of the collection and the name of the corresponding file after the `databaseURL`. The `databaseURL`, the collection name, and the filename must be divided by forward slash, like so: `mv-storage="databaseURL/collectionName/filename"`. You can also leave the collection name default and specify only the file name, like so: `mv-storage="databaseURL/filename"` (see [example](#demo) below).

Need to get realtime updates? Add the `mv-firebase-realtime` attribute to the Mavo root element.

The files in the storage bucket are presented in a _hierarchical structure_, just like the file system on your local hard disk. Every app has its own folder (which name matches the Mavo app's name) for all its files. You can specify the name of that folder via the `mv-firebase-storage` attribute, like so: `mv-firebase-storage="folderName"`.

## Demo

```markup
<main
    mv-app="myAwesomeApp"
    mv-plugins="firebase-firestore"
    mv-storage="https://mavo-demos.firebaseio.com/todo"
    mv-firebase-key="AIzaSyDvZ3EBuhlvFm529vMPeU7dbqvdkjv9WQU"
    mv-firebase="auth">
    <header>
        <h1>My tasks</h1>
        <p>
            <strong>[count(done)]</strong> done out of
            <strong>[count(task)]</strong> total
        </p>
    </header>

    <ul>
        <li property="task" mv-multiple>
            <label>
                <input property="done" type="checkbox" />
                <span property="taskTitle">Do stuff</span>
            </label>
        </li>
        <button
            class="clear-completed mv-logged-in"
            mv-action="delete(task where done)">
            Clear Completed
        </button>
    </ul>
</main>
<style>
@font-face {
	font-family: "Marker Felt";
	src: local("Marker Felt"), url("https://dmitrysharabin.github.io/mavo-firebase-firestore/demos/todo/Marker-Felt.woff");
}

body {
	padding: 1em;
	background: url("https://dmitrysharabin.github.io/mavo-firebase-firestore/demos/todo/wood.png") #4e2e0e;
	text-align: center;
	font: 100% Helvetica Neue, sans-serif;
	color: white;
}
body * {
	margin: 0;
	padding: 0;
	font-family: inherit;
	font-size: inherit;
	line-height: inherit;
	color: inherit;
}
body a {
	text-decoration: none;
}

@-webkit-keyframes transform {
	from {
		transform: rotate(8deg);
	}
}

@keyframes transform {
	from {
		transform: rotate(8deg);
	}
}
main ul {
	position: relative;
	z-index: 1;
	display: block;
	max-width: 20em;
	padding: 2em;
	margin: 1em auto 3em;
	border-top-right-radius: 100% 2%;
	border-bottom-left-radius: 1% 100%;
	box-shadow: 2px 3px 20px black, 0 0 60px #8a4d0f inset;
	background: #fffef0;
	font-size: 120%;
	text-align: left;
}
main ul::before,
main ul::after {
	content: "";
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: -1;
	background: inherit;
	box-shadow: inherit;
	transform: rotate(-3deg);
	-webkit-animation: transform 0.4s cubic-bezier(0.25, 0.1, 0.4, 1.5);
	animation: transform 0.4s cubic-bezier(0.25, 0.1, 0.4, 1.5);
}
main ul::after {
	transform: rotate(2deg);
}
main :checked + [property="taskTitle"] {
	font-style: italic;
	text-decoration: line-through;
	color: gray;
	mix-blend-mode: multiply;
}
main input::-webkit-input-placeholder {
	font-style: italic;
	color: #999;
	mix-blend-mode: multiply;
}
main input::-moz-placeholder {
	font-style: italic;
	color: #999;
	mix-blend-mode: multiply;
}
main button.mv-add-task {
	padding: 0.2em 0.5em;
	margin-top: 1em;
	border-radius: 0.3em;
	border: 1px solid rgba(0, 0, 0, 0.2);
	background: #85c20a
		linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));
	box-shadow: 0 1px rgba(255, 255, 255, 0.5) inset, 0 0.1em 0.2em -0.1em black;
	color: white;
	text-shadow: 0 -1px 1px rgba(0, 0, 0, 0.5);
	font-weight: bold;
	cursor: pointer;
	font-size: 120%;
}
main button.mv-add:hover {
	background-color: orange;
}
main button.mv-add:active {
	box-shadow: 0 0.1em 0.3em rgba(0, 0, 0, 0.8) inset;
	background-image: none;
}
main > header {
	display: block;
	margin: 2em 0 3em;
	text-shadow: 0 -1px 3px black;
	opacity: 0.9;
	font-size: 120%;
}
main > header > h1 {
	font-weight: 100;
	font-size: 400%;
	font-family: inherit;
	opacity: 0.6;
}
main > header > p {
	margin-top: 0.5em;
}
main .auth-controls,
main .progress {
	mix-blend-mode: multiply;
}
main .mv-item-bar.mv-ui {
	position: static;
	pointer-events: auto;
	opacity: 1 !important;
	mix-blend-mode: multiply;
	border: 0;
}

li[property="task"] {
	display: flex;
	align-items: center;
	border-bottom: 1px dashed rgba(51, 85, 153, 0.5);
	list-style: none;
	color: #013;
	font-size: 1.5rem;
}
li[property="task"].mv-deleted {
	padding: 0.3em;
}
li[property="task"] label {
	flex: 1;
	padding: 0.2em;
	margin: 0.3em 0;
	font-family: Marker Felt, Helvetica Neue, sans-serif;
}

.clear-completed {
	background: none;
	border: none;
	color: black;
	float: right;
	margin-top: 1.5em;
	text-decoration: underline;
	opacity: 0.6;
	cursor: pointer;
}
.clear-completed:hover {
	opacity: 1;
}

[mv-app]:not([mv-mode="edit"]) .clear-completed {
	display: none;
}
</style>
```

## Security rules examples

You can use this [security rules generator]() to manage rules for your apps.

### General rules

#### Cloud Firestore

1. Allow read/write access on all documents to any authenticated user:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth.uid != null;
    }
  }
}
```

2. Allow public read/write access on all documents:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Allow public read access, but only authenticated users can write:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true
      allow write: if request.auth.uid != null;
    }
  }
}
```

#### Storage bucket

1. Only authenticated users can read or write to the bucket:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

2. Anyone, even people not using the app, can read or write to the bucket:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write;
    }
  }
}
```

3. Anyone, even people not using the app, can read from the bucket, only authenticated users write to the bucket:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
  }
}
```

### App-specific rules

Suppose your Mavo app has the name `myAwesomeApp`. By default, the **Firebase** backend stores its data in files and folders matching the app's name. Keep in mind that the app data is stored in the file inside the `mavo-apps` collection.

![Default collection "mavo-apps"](https://dmitrysharabin.github.io/mavo-firebase-firestore/images/collection_mavo_apps.png)

The corresponding security rules could look like that:

#### Cloud Firestore

1. Allow read/write access on your app's data to any authenticated user:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /mavo-apps/myAwesomeApp {
      allow read, write: if request.auth.uid != null;
    }
  }
}
```

2. Allow public read/write access on your app's data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /mavo-apps/myAwesomeApp {
      allow read, write: if true;
    }
  }
}
```

3. Allow public read access, but only authenticated users can write:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /mavo-apps/myAwesomeApp {
      allow read: if true
      allow write: if request.auth.uid != null;
    }
  }
}
```

#### Storage bucket

1. Only authenticated users can read or write to the bucket:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /myAwesomeApp {
        match /{allPaths=**} {
            allow read, write: if request.auth != null;
        }
    }
  }
}
```

2. Anyone, even people not using the app, can read or write to the bucket:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /myAwesomeApp {
        match /{allPaths=**} {
            allow read, write;
        }
    }
  }
}
```

3. Anyone, even people not using the app, can read from the bucket, only authenticated users write to the bucket:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /myAwesomeApp {
        match /{allPaths=**} {
            allow read;
            allow write: if request.auth != null;
        }
    }
  }
}
```

**Warning**: These rules are applied only to the `myAwesomeApp` app and its data. If you use them as is data and files of other apps that use the same Firebase project become inaccessible. So what to do? Save some patience and wait a bit for the [security rules generator]() app. 😉
