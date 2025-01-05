export default function Page() {
    return (
      <div className="privacy-policy container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-primary mb-4">
          Politique de Confidentialité de OchoApp
        </h1>
        <p className="text-sm text-foreground text-center mb-8">
          Date d&apos;entrée en vigueur : 05 Janvier 2024
        </p>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-3">1. Introduction</h2>
          <p className="text-foreground leading-relaxed">
            Bienvenue sur OchoApp ! Nous nous engageons à protéger votre vie privée et vos données personnelles. Cette politique de confidentialité explique quelles données nous collectons, comment nous les utilisons, et quels sont vos droits en matière de protection des données.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-3">2. Données que nous collectons</h2>
          <p className="text-foreground mb-4">
            Lorsque vous utilisez OchoApp, nous pouvons collecter les informations suivantes :
          </p>
          <ul className="list-disc list-inside text-foreground space-y-2">
            <li><strong>Nom complet</strong> : Votre nom complet est collecté pour créer votre profil utilisateur.</li>
            <li><strong>Données publiques</strong> : Les informations que vous choisissez de rendre publiques, comme vos publications, sont accessibles par tous les utilisateurs de OchoApp.</li>
            <li><strong>Publications publiques</strong> : Tout contenu que vous publiez sur OchoApp, y compris les textes, images, et vidéos, est stocké et peut être visible par d&apos;autres utilisateurs.</li>
            <li><strong>Photo de profil</strong> : Votre photo de profil est utilisée pour personnaliser votre compte et est visible par les autres utilisateurs.</li>
            <li><strong>Nombre de followers</strong> : Nous collectons et affichons le nombre d&apos;utilisateurs qui vous suivent sur OchoApp.</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-3">3. Utilisation des données</h2>
          <p className="text-foreground mb-4">
            Les données que nous collectons sont utilisées pour :
          </p>
          <ul className="list-disc list-inside text-foreground space-y-2">
            <li>Fournir, maintenir et améliorer nos services.</li>
            <li>Personnaliser votre expérience utilisateur.</li>
            <li>Vous connecter avec d&apos;autres utilisateurs.</li>
            <li>Analyser l&apos;utilisation de OchoApp pour améliorer nos fonctionnalités.</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-3">4. Partage des données</h2>
          <p className="text-foreground mb-4">
            Nous ne partageons vos données personnelles qu&apos;avec votre consentement ou dans les cas suivants :
          </p>
          <ul className="list-disc list-inside text-foreground space-y-2">
            <li>Avec des fournisseurs de services qui nous aident à exploiter OchoApp (hébergement, analyse, etc.).</li>
            <li>Si la loi l&apos;exige ou pour répondre à des demandes légales.</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-3">5. Sécurité des données</h2>
          <p className="text-foreground leading-relaxed">
            Nous mettons en œuvre des mesures de sécurité pour protéger vos données contre tout accès non autorisé, altération, divulgation ou destruction.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-3">6. Vos droits</h2>
          <p className="text-foreground mb-4">
            Vous avez le droit de :
          </p>
          <ul className="list-disc list-inside text-foreground space-y-2">
            <li>Accéder à vos données personnelles.</li>
            <li>Demander la correction ou la suppression de vos données.</li>
            <li>Vous opposer au traitement de vos données.</li>
            <li>Retirer votre consentement à tout moment.</li>
          </ul>
          <p className="text-foreground mt-4">
            Pour exercer ces droits, contactez-nous à l&apos;adresse suivante : ochokom@ochotouchsolution.onmicrosoft.com.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-3">7. Modifications de la politique de confidentialité</h2>
          <p className="text-foreground leading-relaxed">
            Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle politique sur cette page.
          </p>
        </section>
  
        <section>
          <h2 className="text-2xl font-semibold text-muted-foreground mb-3">8. Contact</h2>
          <p className="text-foreground leading-relaxed">
            Si vous avez des questions concernant cette politique de confidentialité, vous pouvez nous contacter à l&apos;adresse suivante : ochokom@ochotouchsolution.onmicrosoft.com.
          </p>
        </section>
      </div>
    );
  }