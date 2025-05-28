<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="left"><a href="https://www.typescriptlang.org/" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/TypeScript.svg" alt="TypeScript" height="60" /></a><a href="https://graphql.org" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/GraphQL-Dark.svg" alt="Graphql" height="60" /></a><a href="https://www.apollographql.com/docs/" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/Apollo.svg" alt="apollo" width="60" height="60"/></a><a href="https://www.mongodb.com/" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/MongoDB.svg" alt="mongodb" width="60" height="60"/></a><a href="https://nodejs.org/en/docs/" target="_blank"><img height="60" src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/NodeJS-Dark.svg" /></a><a href="https://eslint.org/" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/Eslint-Dark.svg" alt="eslint" width="60" height="60"/></a><a href="https://jestjs.io/" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/Jest.svg" alt="jest" width="60" height="60"/></a><a href="https://www.npmjs.com/~jpb06" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/Npm-Dark.svg" alt="npm" width="60" height="60"/></a><a href="https://www.markdownguide.org/" target="_blank"><img src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/Markdown-Dark.svg" alt="markdown" height="60" /></a><a href="https://prettier.io/docs/en/index.html" target="_blank"><img height="60" src="https://raw.githubusercontent.com/jpb06/jpb06/master/icons/Prettier-Dark.svg" /></a></p>

## Description

TODO

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

## Madge

Madge is a developer tool for generating a visual graph of your module dependencies, finding circular dependencies, and giving you other useful info.

```bash
npm install -g madge
```

```bash
madge --circular src/app.module.ts
```

## GraphQL

<img src="https://graphql.org/_next/static/media/logo.ad338028.svg" alt="GraphQL Logo" width="100" />

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

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
