<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="left"><a href="https://www.typescriptlang.org/" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/TypeScript.svg" alt="TypeScript" height="60" /></a><a href="https://www.mongodb.com/" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/MongoDB.svg" alt="mongodb" width="60" height="60"/></a><a href="https://nodejs.org/en/docs/" target="_blank"><img height="60" src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/NodeJS-Dark.svg" /></a><a href="https://eslint.org/" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/Eslint-Dark.svg" alt="eslint" width="60" height="60"/></a><a href="https://jestjs.io/" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/Jest.svg" alt="jest" width="60" height="60"/></a><a href="https://www.npmjs.com/~jpb06" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/Npm-Dark.svg" alt="npm" width="60" height="60"/></a><a href="https://www.markdownguide.org/" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/Markdown-Dark.svg" alt="markdown" height="60" /></a><a href="https://prettier.io/docs/en/index.html" target="_blank"><img height="60" src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/Prettier-Dark.svg" /></a></p>

## Description

A NestJS scraper for TradingView, leveraging Puppeteer for browser automation and Cheerio for HTML parsing.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## 📘 Web Scraper API Documentation

### 📌 Endpoint: `POST /web-scraper/strategy-data`

Retrieve trading strategy data from TradingView via Puppeteer scraping.

---

#### 🔐 Authentication

All requests **must** include an API key in the header:

| Header Name | Example Value        |
|-------------|----------------------|
| `x-api-key` | `sk-1234567890abcdef` |

---

#### 📨 Request

- **Method**: `POST`
- **URL**: `http://localhost:3000/web-scraper/strategy-data`
- **Content-Type**: `application/json`

##### 📂 Request Body Parameters

| Parameter            | Type   | Required | Description                                |
|----------------------|--------|----------|--------------------------------------------|
| `symbol`             | string | ✅       | Trading pair symbol (e.g., `BTCUSDT`)      |
| `exchange`           | string | ✅       | Exchange name (e.g., `BINANCE`)            |
| `interval`           | string | ✅       | Chart interval (e.g., `60`, `240`, `1D`)   |
| `strategyTitle`      | string | ✅       | Full strategy title for exact matching     |
| `shortStrategyTitle` | string | ❌       | Short version of the strategy title        |

---

#### 📦 Example Request with cURL

```bash
curl -X POST http://localhost:3000/web-scraper/strategy-data \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-1234567890abcdef" \
  -d '{
    "symbol": "BTCUSDT",
    "exchange": "BINANCE",
    "interval": "120",
    "strategyTitle": "My Awesome Strategy",
    "shortStrategyTitle": "AwesomeStrat"
  }'
```

```bash
curl -X POST http://localhost:3003/web-scraper/strategy-data -H "Content-Type: application/json" -H "x-api-key: ton_api_key_ultra_secrete" -d "{\"symbol\":\"XRPUSDT\",\"exchange\":\"KUCOIN\",\"interval\":\"120\",\"strategyTitle\":\"Machine Learning: Lorentzian Classification\",\"shortStrategyTitle\":\"Lorentzian Classification\"}"
```

## Madge

Madge is a developer tool for generating a visual graph of your module dependencies, finding circular dependencies, and giving you other useful info.

```bash
npm install -g madge
```

```bash
madge --circular src/app.module.ts
```

## Mongosh - Accédez et Gérez Votre Base de Données MongoDB

<img src="https://upload.wikimedia.org/wikipedia/en/5/5a/MongoDB_Fores-Green.svg" alt="MongoDB Logo" width="200" />

### Présentation

Mongosh (version 2.4.0) est l'interface en ligne de commande moderne pour interagir avec MongoDB. Elle vous permet de vous connecter à votre base de données, de manipuler vos données et de configurer votre instance MongoDB.

**Important :** La version 2.0.0 ou supérieure de Mongosh est requise pour fonctionner avec Atlas Stream Processing.

### Installation et Utilisation

1.  **Installation de Mongosh :**
    * Assurez-vous d'avoir Mongosh installé sur votre système. Vous pouvez le télécharger depuis le site officiel de MongoDB : [https://www.mongodb.com/try/download/shell](https://www.mongodb.com/try/download/shell)

2.  **Connexion à votre base de données :**
    * Utilisez la chaîne de connexion suivante dans votre ligne de commande pour vous connecter à votre cluster MongoDB Atlas :

    ```bash
    mongosh "mongodb+srv://cluster0.vvg4u.gcp.mongodb.net/" --apiVersion 1 --username <db_username>
    ```

    * Remplacez `<db_username>` par le nom d'utilisateur de votre base de données.

3.  **Saisie du mot de passe :**
    * Vous serez invité à saisir le mot de passe de l'utilisateur de la base de données.
    * **Attention :** Assurez-vous que tous les caractères spéciaux de votre mot de passe sont encodés en URL. Par exemple, remplacez `@` par `%40`, `#` par `%23`, etc.

### Exemple d'utilisation

Une fois connecté, vous pouvez exécuter des commandes MongoDB directement dans Mongosh. Par exemple :

* Afficher les bases de données :

    ```javascript
    show dbs
    ```

* Utiliser une base de données spécifique :

    ```javascript
    use ma_base_de_donnees
    ```

* Trouver des documents dans une collection :

    ```javascript
    db.ma_collection.find()
    ```

### Atlas Stream Processing

Pour utiliser Mongosh avec Atlas Stream Processing, assurez-vous d'utiliser Mongosh version 2.0.0 ou supérieure.

### Liens utiles

* Télécharger Mongosh : [https://www.mongodb.com/try/download/shell](https://www.mongodb.com/try/download/shell)
* Documentation MongoDB : [https://docs.mongodb.com/](https://docs.mongodb.com/)
* Documentation Mongosh : [https://www.mongodb.com/docs/mongodb-shell/](https://www.mongodb.com/docs/mongodb-shell/)

## 🔍 Récupération des Cookies JSON depuis Chrome

Cette méthode permet d'extraire facilement les cookies d'un domaine actif dans Google Chrome au format JSON, directement depuis la console de développement (DevTools).

### 🧰 Prérequis

- Google Chrome ou Chromium.
- Accès à la console de développement (`F12` ou clic-droit > "Inspecter").
- L'onglet **Application** pour voir les cookies.
- La fonction `getCookiesDetails()` copiée dans la console.

### 🛠️ Fonction `getCookiesDetails()`

```javascript
function getCookiesDetails() {
    let cookies = document.cookie.split("; ");
    let cookieDetails = [];

    cookies.forEach(function(cookie) {
        let [name, value] = cookie.split("=");

        let cookieObj = {
            name: name,
            value: value,
            domain: document.domain,
            path: "/",
            secure: location.protocol === 'https:',
            httpOnly: false,
            session: false,
            expirationDate: null
        };

        if (!document.cookie.includes("expires")) {
            cookieObj.session = true;
        }

        cookieDetails.push(cookieObj);
    });

    console.log(JSON.stringify(cookieDetails, null, 2));
}

getCookiesDetails();
```

You must manually set the "HttpOnly" and "Secure" values.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.
