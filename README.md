# APu Consultancy — Azure App Service

Deze website bestaat uit gewone HTML, CSS, JavaScript en lokale media in `dist/`.
Er is geen frontend-framework of bundler. De websitebestanden zijn al gereed.
De dependency-vrije Node-server levert deze bestanden aan Azure App Service.

## Repositorystructuur

Plaats deze bestanden DIRECT in de root van de GitHub-repository, niet in een extra projectmap:

- package.json en package-lock.json
- server.mjs
- dist/ (inclusief alle media en lettertypen; deze map moet in Git blijven)
- scripts/ en tests/
- .github/workflows/azure-app-service.yml
- .gitignore

Het package.json in research/logo-tools is een afzonderlijk onderzoekshulpmiddel en hoort niet bij de website.
De eerdere klant-ZIP is een kijkversie; gebruik voor GitHub de nieuwe APu-Consultancy-Azure-GitHub.zip.

## Lokaal controleren

Gebruik Node.js 24.x en voer vanuit de repositoryroot uit:

```sh
npm ci
npm run build
npm test
npm start
```

Open http://127.0.0.1:4173. Stop met Ctrl+C. De build valideert lokale verwijzingen en ankers;
hij herschrijft de website niet. npm install werkt ook, maar CI gebruikt de vastgelegde lockfile.

## Azure instellen — Linux App Service, Code, Node.js 24 LTS

Deze workflow is voorbereid voor Linux App Service. Het besturingssysteem van de bestaande
Azure-app is nog niet bevestigd. Gebruik deze instructies niet zonder meer voor Windows/IISNode.

1. Controleer de exacte App Service-naam. De opgegeven naam is APuConsultancy.
2. Kies Node.js 24 LTS als runtime.
3. Stel onder Configuration / General settings de Startup Command in op `npm start`.
4. Gebruik `NODE_ENV=production`. Laat Azure `PORT` bepalen en stel geen `HOST=127.0.0.1` in.
   De server gebruikt Azure PORT en luistert dan standaard op 0.0.0.0.
5. Zet `SCM_DO_BUILD_DURING_DEPLOYMENT=false`: GitHub heeft het artifact al voorbereid.
6. Zet Always On aan als het gekozen App Service-plan dit ondersteunt.

## GitHub Actions instellen

Onder Settings > Secrets and variables > Actions:

- Repository variable `AZURE_WEBAPP_NAME`: exacte App Service-naam (controleer APuConsultancy).
- Secret `AZURE_WEBAPP_PUBLISH_PROFILE`: de inhoud van het publish profile van deze app.
  Dit geheim alleen in GitHub Secrets invoeren, nooit in de repository of chat.

De meegeleverde workflow gebruikt publish-profile-authenticatie. Deze methode vereist dat
SCM Basic Auth Publishing Credentials voor de App Service toegestaan zijn. Als die methode
in deze Azure-omgeving uitstaat of de bestaande workflow OIDC gebruikt, behoud dan OIDC en
pas alleen de login/deploystap daarop aan; verlaag beveiligingsinstellingen niet voor deze template.
Een bestaande Azure-secret met een andere naam moet in de workflow worden gekoppeld of onder
de hierboven genoemde naam beschikbaar worden gemaakt.

Er was in deze lokale kopie geen bestaande workflow en geen GitHub-remote beschikbaar.
Vervang in de echte repository de falende Azure-workflow door deze workflow; laat geen tweede
oude deploymentworkflow parallel actief. Controleer de bestaande authenticatie voordat u vervangt.

De workflow bouwt bij pushes en pull requests naar main/master en kan handmatig worden gestart.
Alleen de standaardbranch kan deployen; pull requests deployen nooit.
Bij een andere branchnaam: pas de branchfilters in de workflow aan.
Deployment gebruikt de GitHub environment `production`; stel daar desgewenst goedkeuring in.

## Deploymentpakket

`npm run package:azure` maakt `.azure-package/` met package.json, lockfile, server, scripts,
tests en dist op het juiste niveau. Deze map moet voor een nieuwe verpakking leeg zijn.
De workflow gebruikt telkens een verse checkout. Geen node_modules, onderzoeksdownloads,
Git-gegevens of ZIP-bestanden worden gedeployed. Er zijn geen runtime-npm-dependencies.

In GitHub Actions worden installatie, validatie en tests in de repositoryroot uitgevoerd.
Daarna wordt het artifact doorgegeven aan azure/webapps-deploy@v3. Alleen dist uploaden
is onjuist voor deze Node-configuratie: Azure heeft ook de server en package.json nodig.

## Validatie en grenzen

Lokaal uitgevoerd: npm install, npm ci, npm run build, npm test, package:azure en tests vanuit
het gemaakte artifact. Alle websitebestanden zijn met SHA-256 vergeleken: geen ontwerp- of
inhoudswijzigingen. De test controleert de doorgegeven PORT, starten vanuit een andere map,
alle statische bestanden byte voor byte, MIME-types, 404 en afscherming van serverbestanden.

Een echte Azure-deployment is nog niet uitgevoerd of geverifieerd: er is geen repository-URL,
Azure-toegang of bevestigde OS/authenticatieconfiguratie beschikbaar. Controleer na de eerste run
de App Service Log stream, homepage, logo's en mobiele navigatie op het openbare adres.

Bronnen:
- https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs
- https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions
