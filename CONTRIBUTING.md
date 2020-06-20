# Steps for new release

1. Change the version in `package.json`, save but don't commit yet.
2. Start from the repo root and run the following commands (replace **X.Y.Z** with the new version number, e.g., **0.2.0**):

```
gulp build
cd dist
mkdir -m 777 X.Y.Z
cp mavo-firebase-firestore.js ../
cp mavo-firebase-firestore.css ../
mv *.* X.Y.Z
cd ..
```

3. Commit and push.
4. Create new release on **Github**.
