This is a website to create a PDF with the most important informations about your LoL-Account!

# --- to code: ----------------------------------------

-To start the server localy: 'npm run dev'
# ------------
-To deploy spawn bugfix: 'git.js' -> 
/**
 * Remove all unversioned files.
 * @param {string | Array<string>} files Files argument.
 * @return {Promise} A promise.
 */
Git.prototype.rm = function (files) {
  if (!Array.isArray(files)) {
    files = [files];
  }
  return this.exec('rm', '--ignore-unmatch', '-r', '-f', '--', ...files);
};

/**
 * Remove all unversioned files.
 * @param {string | Array<string>} files Files argument.
 * @return {Promise} A promise.
 */
Git.prototype.rm = function () {
  return this.exec('rm', '--ignore-unmatch', '-r', '-f', '--', '.');
};

# ------------

The API key has to be activated (needs to be refreshed every 24h): https://developer.riotgames.com/

# ------------

To deploy the website: 'npm run build' -> 'npm run deploy' and set github-pages on the correct branch 'gh-pages/root'

# ------------

## Cloudflare Worker Proxy 

Auf Cloudware ist der Worker mit der Riot-API aktiv.
Dieser ist immer in der .env erreichbar. 
Um diesen zu aktualisieren:

```bash
cd server/cloudflare
npx wrangler secret put RIOT_API_KEY
npx wrangler deploy
```

# --- todo: ------------------------------------------

- db fertig stellen
- dateien updtodate halten durch github action...?
- Loginfunktion
- db key über cloudflare deployn

# --- ideas: ------------------------------------------

- button to share the pdf directly in social media
-